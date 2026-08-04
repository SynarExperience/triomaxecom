// Transcodifica um vídeo para MP4/H.264 com bitrate exato.
//
//   swift scripts/transcodificar-video.swift <origem> <destino> <ladoMaior> <kbps> <com-audio|sem-audio>
//
// Existe porque o avconvert do macOS não deixa escolher o bitrate: o preset
// Preset960x540 gerava 12 Mbps num vídeo de 540x960 — 49 MB para 34 segundos.
// AVAssetWriter aceita AVVideoAverageBitRateKey e resolve em ~7 MB com a mesma
// resolução. Roda interpretado (`swift arquivo.swift`), sem compilar nada.
import AVFoundation
import Foundation

let args = Array(CommandLine.arguments.suffix(5))
guard args.count == 5, let ladoMaior = Double(args[2]), let kbps = Int(args[3]) else {
    FileHandle.standardError.write(
        "uso: transcodificar-video.swift <origem> <destino> <ladoMaior> <kbps> <com-audio|sem-audio>\n"
            .data(using: .utf8)!)
    exit(2)
}

let origem = URL(fileURLWithPath: args[0])
let destino = URL(fileURLWithPath: args[1])
let comAudio = args[4] == "com-audio"

let asset = AVAsset(url: origem)
guard let trilhaVideo = asset.tracks(withMediaType: .video).first else {
    FileHandle.standardError.write("sem trilha de vídeo em \(origem.path)\n".data(using: .utf8)!)
    exit(1)
}

/*
 * O iPhone grava 1920x1080 deitado e marca a rotação numa matriz. Deixar essa
 * matriz no arquivo funciona na maioria dos navegadores, mas nem em todos — por
 * isso a rotação é aplicada aqui, e o MP4 sai já em pé.
 */
let transformacao = trilhaVideo.preferredTransform
let natural = trilhaVideo.naturalSize
let girado = natural.applying(transformacao)
let exibicao = CGSize(width: abs(girado.width), height: abs(girado.height))

let escala = min(1, ladoMaior / max(exibicao.width, exibicao.height))
// H.264 exige dimensões pares.
func par(_ valor: Double) -> Int {
    let arredondado = Int(valor.rounded())
    return arredondado % 2 == 0 ? arredondado : arredondado + 1
}
let largura = par(exibicao.width * escala)
let altura = par(exibicao.height * escala)

let camada = AVMutableVideoCompositionLayerInstruction(assetTrack: trilhaVideo)
camada.setTransform(
    transformacao.concatenating(
        CGAffineTransform(
            scaleX: Double(largura) / exibicao.width, y: Double(altura) / exibicao.height)),
    at: .zero)

let instrucao = AVMutableVideoCompositionInstruction()
instrucao.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
instrucao.layerInstructions = [camada]

let composicao = AVMutableVideoComposition()
composicao.renderSize = CGSize(width: largura, height: altura)
composicao.frameDuration = CMTime(value: 1, timescale: 30)
composicao.instructions = [instrucao]

let leitor = try AVAssetReader(asset: asset)
let saidaVideo = AVAssetReaderVideoCompositionOutput(
    videoTracks: [trilhaVideo],
    videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
saidaVideo.videoComposition = composicao
leitor.add(saidaVideo)

var saidaAudio: AVAssetReaderTrackOutput?
if comAudio, let trilhaAudio = asset.tracks(withMediaType: .audio).first {
    let saida = AVAssetReaderTrackOutput(
        track: trilhaAudio,
        outputSettings: [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsBigEndianKey: false,
            AVLinearPCMIsNonInterleaved: false,
        ])
    leitor.add(saida)
    saidaAudio = saida
}

try? FileManager.default.removeItem(at: destino)
let escritor = try AVAssetWriter(outputURL: destino, fileType: .mp4)
// Joga o índice do MP4 para o começo do arquivo: sem isso o navegador só começa
// a tocar depois de baixar o vídeo inteiro.
escritor.shouldOptimizeForNetworkUse = true

let entradaVideo = AVAssetWriterInput(
    mediaType: .video,
    outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: largura,
        AVVideoHeightKey: altura,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: kbps * 1000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
            AVVideoMaxKeyFrameIntervalKey: 60,
        ],
    ])
entradaVideo.expectsMediaDataInRealTime = false
escritor.add(entradaVideo)

var entradaAudio: AVAssetWriterInput?
if saidaAudio != nil {
    let entrada = AVAssetWriterInput(
        mediaType: .audio,
        outputSettings: [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVNumberOfChannelsKey: 2,
            AVSampleRateKey: 44100,
            AVEncoderBitRateKey: 96000,
        ])
    entrada.expectsMediaDataInRealTime = false
    escritor.add(entrada)
    entradaAudio = entrada
}

escritor.startWriting()
escritor.startSession(atSourceTime: .zero)
leitor.startReading()

let grupo = DispatchGroup()

func bombear(_ entrada: AVAssetWriterInput, _ saida: AVAssetReaderOutput, _ fila: String) {
    grupo.enter()
    entrada.requestMediaDataWhenReady(on: DispatchQueue(label: fila)) {
        while entrada.isReadyForMoreMediaData {
            guard let amostra = saida.copyNextSampleBuffer() else {
                entrada.markAsFinished()
                grupo.leave()
                return
            }
            entrada.append(amostra)
        }
    }
}

bombear(entradaVideo, saidaVideo, "video")
if let entrada = entradaAudio, let saida = saidaAudio { bombear(entrada, saida, "audio") }

grupo.wait()

let pronto = DispatchSemaphore(value: 0)
escritor.finishWriting { pronto.signal() }
pronto.wait()

if escritor.status != .completed {
    FileHandle.standardError.write(
        "falhou: \(escritor.error?.localizedDescription ?? "erro desconhecido")\n".data(using: .utf8)!
    )
    exit(1)
}

let bytes = ((try? FileManager.default.attributesOfItem(atPath: destino.path))?[.size] as? Int) ?? 0
print(
    "\(destino.lastPathComponent)  \(largura)x\(altura)  "
        + "\(String(format: "%.1f", Double(bytes) / 1_048_576)) MB")
