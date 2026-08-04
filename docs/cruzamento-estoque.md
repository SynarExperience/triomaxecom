# Cruzamento vitrine × gerenciador de estoque

Levantamento de 03/08/2026, comparando os 57 produtos da vitrine
(`produtos`, projeto `bsbefgdmmpjmydtqrcxt`) com os 86 do gerenciador
(`public.products`, projeto `anttzsyczxbyhjuonirw`).

Serve para preencher **ID de integração** na tela de edição de cada produto do
painel. Preenchido o campo, `scripts/sincronizar-estoque.mjs` passa a puxar o
saldo daquele item sozinho.

Os dois catálogos não têm chave comum: o gerenciador nomeia pela cor comercial
do fornecedor ("Fuchsia Pink") e a vitrine pela cor genérica em português
("Rosa choque"). Por isso a coluna do ID é uma sugestão a conferir, não um
resultado automático — **quem sabe qual bobina é qual é você.**

## 1. Pares conferidos (27)

Marca, material, cor e preço batem dos dois lados.

| Produto na vitrine | slug | Estoque hoje | **Código a preencher** | Item no gerenciador | Observação |
|---|---|---|---|---|---|
| Caixa Dry Box para Armazenamento de Filamentos | caixa-dry-box-para-armazenamento-de-filamentos | 2 | `TMX-0092` | Caixa Dry Box Para Armazenamento de Filamentos (2 un) | nome equivalente |
| Conjunto de Aquecimento Bambu Lab | conjunto-de-aquecimento-bambu-lab | 2 | `TMX-0035` | Conjunto de Aquecimento Bambu Lab A1 mini (2 un) | nome equivalente |
| Filamento PETG FusionX Branco | filamento-petg-fusionx-branco | 4 | `TMX-0119` | Fusionx PETG 1KG Off White (4 un) | nome equivalente |
| Filamento PETG FusionX Rosa choque | filamento-petg-fusionx-rosa-choque | 3 | `TMX-0111` | Fusionx PETG Fuchsia Pink (3 un) | nome equivalente |
| Filamento PETG FusionX Rosa escuro | filamento-petg-fusionx-rosa-escuro | 0 | `TMX-0027` | Fusionx PETG Rose Pink (0 un) | nome equivalente |
| Filamento PETG FusionX Verde | filamento-petg-fusionx-verde | 0 | `TMX-0026` | Fusionx PETG Verde Militar (0 un) | nome equivalente |
| Filamento PETG Masterprint Azul translúcido | filamento-petg-masterprint-azul-translucido | 0 | `TMX-0019` | Masterprint PETG Translucido Azul (0 un) | nome equivalente |
| Filamento PETG Masterprint Dourado translúcido | filamento-petg-masterprint-dourado-translucido | 0 | `TMX-0023` | Masterprint PTG Golden (0 un) | nome equivalente |
| Filamento PETG Masterprint Transparente | filamento-petg-masterprint-transparente | 0 | `TMX-0022` | Masterprint PETG Transparente (0 un) | nome equivalente |
| Filamento PETG Masterprint Verde | filamento-petg-masterprint-verde | 0 | `TMX-0024` | Masterprint PETG Verde (0 un) | nome equivalente |
| Filamento PETG Masterprint Vermelho | filamento-petg-masterprint-vermelho | 0 | `TMX-0021` | Masterprint PTG Vermelho (0 un) | nome equivalente |
| Filamento PLA FusionX Cinza | filamento-pla-fusionx-cinza | 1 | `TMX-0083` | Fusionx PLA Dark Gray Grey (1 un) | nome equivalente |
| Filamento PLA FusionX Laranja | filamento-pla-fusionx-laranja | 1 | `TMX-0084` | Fusionx PLA Orange Peal (1 un) | nome equivalente |
| Filamento PLA FusionX Preto | filamento-pla-fusionx-preto | 11 | `TMX-0080` | Fusionx PLA Absolut Black (11 un) | nome equivalente |
| Filamento PLA FusionX Vermelho | filamento-pla-fusionx-vermelho | 1 | `TMX-0108` | Fusionx PLA 1KG Pepper Red (1 un) | nome equivalente |
| Filamento PLA Masterprint Azul | filamento-pla-masterprint-azul | 0 | `TMX-0012` | Masterprint PLA Azul (0 un) | nome equivalente |
| Filamento PLA Masterprint Cinza | filamento-pla-masterprint-cinza | 1 | `TMX-0004` | Masterprint PLA Cinza Claro (1 un) | nome equivalente |
| Filamento PLA Masterprint Cinza grafite | filamento-pla-masterprint-cinza-grafite | 0 | `TMX-0013` | Masterprint PLA Cinza Gris (0 un) | nome equivalente |
| Filamento PLA Masterprint Dourado translúcido | filamento-pla-masterprint-dourado-translucido | 0 | `TMX-0016` | Masterprint PLA Dourado Dorado (0 un) | nome equivalente |
| Filamento PLA Masterprint Laranja vivo | filamento-pla-masterprint-laranja-vivo | 1 | `TMX-0009` | Masterprint PLA Laranja Orange (1 un) | nome equivalente |
| Filamento PLA Masterprint Marrom | filamento-pla-masterprint-marrom | 0 | `TMX-0007` | Masterprint PLA Marrom (0 un) | nome equivalente |
| Filamento PLA Masterprint Roxo | filamento-pla-masterprint-roxo | 0 | `TMX-0008` | Masterprint PLA Roxo (0 un) | nome equivalente |
| Filamento PLA Masterprint Verde | filamento-pla-masterprint-verde | 0 | `TMX-0014` | Masterprint PLA Verde (0 un) | nome equivalente |
| Filamento PLA Masterprint Vermelho | filamento-pla-masterprint-vermelho | 0 | `TMX-0015` | Masterprint PLA Vermelho (0 un) | nome equivalente |
| Hotend Bambu Lab A1 e A1 miniv | hotend-bambu-lab-a1-e-a1-miniv | 16 | `TMX-0034` | Hotend Bambu Lab A1 e A1 mini (16 un) | nome equivalente |
| Impressora 3D Bambu Lab A1 (com combo) | impressora-3d-bambu-lab-a1-com-combo | 0 | `TMX-0099` | Impressora Máquina 3D Bambu Lab A1 COMBO AMS Completo (0 un) | nome equivalente |
| Impressora 3D Bambu Lab A1 (sem combo) | impressora-3d-bambu-lab-a1-sem-combo | 3 | `TMX-0097` | Impressora 3D Bambu Lab A1 Sem Combo (3 un) | nome equivalente |

## 2. Precisam da sua conferência (11)

Mais de um candidato plausível, ou candidato único com gramatura diferente.

| Produto na vitrine | slug | Estoque hoje | **Código a preencher** | Item no gerenciador | Observação |
|---|---|---|---|---|---|
| Filamento Elegoo PLA branco | filamento-elegoo-pla-branco | 3 | `TMX-0078` | Elegoo PLA White (21 un) | linha comum |
| Filamento Elegoo PLA branco | filamento-elegoo-pla-branco | 3 | `TMX-0122` | Elegoo PLA 1KG MATTE White Branco (4 un) | ou: linha MATTE |
| Filamento Elegoo PLA branco 1kg | filamento-elegoo-pla-branco-1kg | 0 | `TMX-0122` | Elegoo PLA 1KG MATTE White Branco (4 un) | linha MATTE |
| Filamento Elegoo PLA branco 1kg | filamento-elegoo-pla-branco-1kg | 0 | `TMX-0078` | Elegoo PLA White (21 un) | ou: linha comum |
| Filamento Elegoo PLA preto 1kg | filamento-elegoo-pla-preto-1kg | 10 | `TMX-0121` | Elegoo PLA 1KG MATTE Black Preto (4 un) | linha MATTE |
| Filamento Elegoo PLA preto 1kg | filamento-elegoo-pla-preto-1kg | 10 | `TMX-0079` | Elegoo PLA Black Preto (0 un) | ou: linha comum |
| Filamento PETG FusionX Preto | filamento-petg-fusionx-preto | 0 | `TMX-0098` | Fusion PETG 1200KG Preto Absolute Black (1 un) | 1,2 kg; a vitrine vende 1 kg |
| Filamento PETG FusionX Rosa claro | filamento-petg-fusionx-rosa-claro | 0 | `TMX-0095` | Fusionx PETG Baby Pink (1 un) | baby pink |
| Filamento PETG FusionX Rosa claro | filamento-petg-fusionx-rosa-claro | 0 | `TMX-0028` | Fusionx PETG Pink Cloud (0 un) | ou: pink cloud |
| Filamento PETG FusionX Vermelho | filamento-petg-fusionx-vermelho | 0 | `TMX-0114` | Fusionx PETG 1KG Vermelho Tijolo (3 un) | tom tijolo |
| Filamento PETG FusionX Vermelho | filamento-petg-fusionx-vermelho | 0 | `TMX-0096` | Fusionx PETG Vermelho Caixa Sem Nome (0 un) | ou: caixa sem nome |
| Filamento PETG FusionX Vermelho | filamento-petg-fusionx-vermelho | 0 | `TMX-0069` | Fusionx PTEG Brick Red (0 un) | ou: brick red |
| Filamento PETG Masterprint Azul | filamento-petg-masterprint-azul | 0 | `TMX-0019` | Masterprint PETG Translucido Azul (0 un) | é o translúcido, já usado pelo outro item |
| Filamento PLA FusionX Branco | filamento-pla-fusionx-branco | 1 | `TMX-0081` | Fusionx PLA Jade Absolute White (1 un) | jade absolute white |
| Filamento PLA FusionX Branco | filamento-pla-fusionx-branco | 1 | `TMX-0107` | Fusionx PLA 1KG White Sand (3 un) | ou: white sand, mais bege |
| Filamento PLA FusionX Rosa escuro | filamento-pla-fusionx-rosa-escuro | 1 | `TMX-0118` | Fusionx PLA 1KG Hibiscus Red (3 un) | é vermelho, não rosa — conferir |
| Filamento PLA FusionX Verde | filamento-pla-fusionx-verde | 1 | `TMX-0110` | Fusionx PLA 500G Moss Green (4 un) | 500 g; a vitrine vende 1 kg |
| Filamento PLA Masterprint Azul translúcido | filamento-pla-masterprint-azul-translucido | 0 | `TMX-0012` | Masterprint PLA Azul (0 un) | é o liso, já usado pelo outro item |

## 3. Sem equivalente no gerenciador (12)

Nada parecido do outro lado. Ou o produto saiu de linha, ou está cadastrado lá
com outro nome. Deixar o ID em branco mantém o item fora do sincronismo.

| Produto na vitrine | slug | Estoque hoje | **Código a preencher** | Item no gerenciador | Observação |
|---|---|---|---|---|---|
| Filamento PETG FusionX Cinza | filamento-petg-fusionx-cinza | 0 | `—` | — | sem candidato |
| Filamento PETG FusionX Laranja | filamento-petg-fusionx-laranja | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Bege | filamento-petg-masterprint-bege | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Cinza | filamento-petg-masterprint-cinza | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Cinza grafite | filamento-petg-masterprint-cinza-grafite | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Laranja vivo | filamento-petg-masterprint-laranja-vivo | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Marrom | filamento-petg-masterprint-marrom | 0 | `—` | — | sem candidato |
| Filamento PETG Masterprint Roxo | filamento-petg-masterprint-roxo | 0 | `—` | — | sem candidato |
| Filamento PLA FusionX Rosa choque | filamento-pla-fusionx-rosa-choque | 1 | `—` | — | sem candidato |
| Filamento PLA FusionX Rosa claro | filamento-pla-fusionx-rosa-claro | 1 | `—` | — | sem candidato |
| Filamento PLA Masterprint Bege | filamento-pla-masterprint-bege | 0 | `—` | — | sem candidato |
| Filamento PLA Masterprint Transparente | filamento-pla-masterprint-transparente | 0 | `—` | — | sem candidato |

## 4. Produtos inativos da vitrine (7)

Fora do ar, com estoque de semente que nunca foi real. Não entram no
sincronismo enquanto estiverem inativos.

| Produto na vitrine | slug | Estoque hoje | **Código a preencher** | Item no gerenciador | Observação |
|---|---|---|---|---|---|
| Filamento PETG Azul | filamento-petg-azul | 79 | `—` | — | inativo |
| Filamento PETG Verde | filamento-petg-verde | 80 | `—` | — | inativo |
| Filamento PLA Amarelo | filamento-pla-amarelo | 111 | `—` | — | inativo |
| Filamento PLA Amarelo (cópia) | filamento-pla-amarelo-copia | 111 | `—` | — | inativo |
| Filamento PLA Branco | filamento-pla-branco | 118 | `—` | — | inativo |
| Filamento PLA Preto | filamento-pla-preto | 119 | `—` | — | inativo |
| Filamento PLA Vermelho | filamento-pla-vermelho | 117 | `—` | — | inativo |

## 5. No gerenciador e fora do site (45)

Itens do gerenciador sem produto correspondente na vitrine. Os que têm saldo
são venda parada — mas cadastrá-los é decisão de catálogo, não de sincronismo.

| Código | Item no gerenciador | Estoque |
|---|---|---|
| `TMX-0025` | Fusionx PETG Transparente Clear Cristal | 9 |
| `TMX-0005` | Masterprint PLA Madeira Escura | 9 |
| `TMX-0101` | Fusionx PLA 500G Jade White | 8 |
| `TMX-0020` | Masterprint PTG Translucido Amarelo | 8 |
| `TMX-0112` | Fusion Petg 1KG Magenta Purple | 7 |
| `TMX-0102` | Fusionx PLA 500G Absolute Black Preto | 6 |
| `TMX-0105` | Fusionx PLA 1KG Sky Blue | 5 |
| `TMX-0126` | Elegoo PLA 1KG MATTE Beige | 3 |
| `TMX-0125` | Elegoo PLA 1KG MATTE Earth Brown | 2 |
| `TMX-0031` | Fulljoy PETG Orange | 2 |
| `TMX-0131` | Fulljoy PLA+ 1KG Chinese Red | 2 |
| `TMX-0133` | Fulljoy PLA+ 1KG Flower Blue | 2 |
| `TMX-0132` | Fulljoy PLA+ 1KG GEMSTONE BLUE | 2 |
| `TMX-0135` | Fulljoy PLA+ 1KG Mech Grey | 2 |
| `TMX-0134` | Fulljoy PLA+ 1KG Skin | 2 |
| `TMX-0113` | Fusionx PETG 1KG Amarelo Canario | 2 |
| `TMX-0100` | Fusionx PETG 1KG Banana Yellow | 2 |
| `TMX-0116` | Fusionx PLA 1,200KG Absolute Black Preto | 2 |
| `TMX-0103` | Fusionx PLA 500G Caramel Brown | 2 |
| `TMX-0127` | Elegoo PLA 1KG MATTE Ice Blue | 1 |
| `TMX-0124` | Elegoo PLA 1KG MATTE Navy Blue | 1 |
| `TMX-0123` | Elegoo PLA 1KG MATTE Red Ruby | 1 |
| `TMX-0033` | Fulljoy PLA  Orange | 1 |
| `TMX-0130` | Fulljoy PLA+ 1KG Lemon Yellow | 1 |
| `TMX-0129` | Fulljoy PLA+ 1KG Sky Blue | 1 |
| `TMX-0117` | Fusionx PLA 1KG Artic Blue | 1 |
| `TMX-0106` | Fusionx PLA 1KG Jade Blue | 1 |
| `TMX-0128` | Fulljoy PLA+ 1KG Iris Purple | 0 |
| `TMX-0030` | Fusionx  PLA Peach Z Series | 0 |
| `TMX-0120` | Fusionx PETG 1KG Lemon Ice | 0 |
| `TMX-0029` | Fusionx PETG Absolut White + Rose Red | 0 |
| `TMX-0077` | Fusionx PETG Artic Blue | 0 |
| `TMX-0067` | Fusionx PETG Rosa | 0 |
| `TMX-0115` | Fusionx PLA 1,200KG Jade White | 0 |
| `TMX-0109` | Fusionx PLA 1KG Yellow | 0 |
| `TMX-0032` | Fusionx PLA Outlet | 0 |
| `TMX-0104` | Fusionx PLA Pastel Violet 1KG | 0 |
| `TMX-0082` | Fusionx PLA Pench Z Series | 0 |
| `TMX-0076` | Fusionx PTEG Hibiscus | 0 |
| `TMX-0094` | Masterprint Petg Branco 3 Kg | 0 |
| `TMX-0006` | Masterprint PLA Madeira | 0 |
| `TMX-0017` | Masterprint PLA Marmore | 0 |
| `TMX-0011` | Masterprint PLA Prata | 0 |
| `TMX-0010` | Masterprint PLA Verde Escuro | 0 |
| `TMX-0018` | Masterprint PTG Branco | 0 |
