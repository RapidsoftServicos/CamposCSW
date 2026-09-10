# CamposCSW

Editor visual de layout CSW (labels, campos `%CSLE`, displays, botões e **grid**) para gerar coordenadas e tags.

Publicado via **GitHub Pages**:  
`https://rapidsoftservicos.github.io/CamposCSW/`

## Uso

1. Defina o tamanho da tela (`AJ`) — padrão **80 × 17** (máx. **108 × 28**).
2. Adicione itens pela paleta e posicione no canvas (arraste / redimensione).
3. **Clique em um item** → menu **Renomear / Copiar / Excluir**; o snippet aparece à direita.
4. Use **Export completo** (Tags CSW / CSLE · Grid / Tudo) ou **Importar** + **Aplicar no canvas**.
5. Cole na `.mac`.

### Paleta

| Item | Gera |
|------|------|
| **Label** | `; csw:label:COL,LIN,TAM,Texto` |
| **Campo (CSLE)** | `1000ON do ^%CSLE(LIN,COL,TAM,...)` |
| **Display** | `; csw:display:COL,LIN,TAM,ds1000` |
| **Botão** | `; csw:botao:COL,LIN,...` |
| **BtnConsultar** | `; csw:btnConsultar:COL,LIN,...` |
| **Grid** | `set TABGRID(1)="; csw:gridConf:..."` |

### Labels (importante)

- Sempre na **coluna 1** — não mude a coluna; só aumente/diminua o `TAM`.
- Ex.: `; csw:label:1,1,10,Máscara` (campo na col. 11 → `TAM ≈ 10`).
- `TAM` = **largura da caixa**, não o tamanho da palavra.
- Texto alinha à **direita** dentro da caixa.
- Todas as labels devem ter o **mesmo TAM** (alinham na mesma coluna).
- Com campo na coluna 14 → labels com `TAM ≈ 13` (ex.: `; csw:label:1,1,13,Código`).
- Botão **Esticar labels até o campo** ajusta o TAM até a coluna do CSLE.
- No editor a coluna da label fica travada em 1 (arraste só muda a linha).

### Grid

- Só posiciona a área do grid (`LinPos`, `Altura`, `LinIni`, `LinFim`).
- No Consistem (Faces) a área visual é ~**Altura + 2** (toolbar). Botão logo após o `LinFim` pode ficar **por baixo** do grid.
- Com `LinPos=5` e `Altura=14` o Faces cobre até ~**L20** → botões em **≥ 21** (ex.: linha **22**).
- Botão **Ajustar botões abaixo do grid** sobe os botões para a linha segura.
- **Exemplo com Grid** monta só o `TABGRID` (sem campos/botões).

## Importar

Aceita, numa mesma cola:

- tags `csw:label` / `csw:display` / `csw:botao` / `csw:btnConsultar` / `csw:aj`
- linhas `%CSLE` (lê só **LIN, COL, TAM**)
- `%CSUTIMM` (coords no final)
- `TABGRID` / `gridConf` — lê **somente** `LinPos`, `Altura`, `LinIni`, `LinFim`  
  (ignora `cod`, `HabilitaNavegacao`, `LabelEdit`, `gridCols`, etc.)

Exemplo de grid:

```
set TABGRID(1)="; csw:gridConf:cod=1; LinPos=5; Altura=18; LinIni=5; LinFim=24; HabilitaNavegacao=1;"
```

## Regras aplicadas

- Limite de tela: até **108 × 28**
- Tags `csw:label` / `csw:display` / `csw:botao`: **coluna, linha, tamanho**
- `%CSLE`: **linha, coluna, tamanho** (ordem diferente das tags)
- No canvas o campo usa o **TAM** declarado; na tela real o CSLE ocupa ~**TAM + 2** pelos `[ ]`
- Snap de meia coluna (`12.5`, `16.5`, …)
- Label: TAM inteiro (o Consistem inteiriza)

## GitHub Pages

No repositório:

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / pasta `/ (root)`
4. Salve e aguarde alguns minutos

## Estrutura

```
CamposCSW/
├── index.html
├── css/styles.css
├── js/app.js
└── README.md
```

Site estático — sem build.
