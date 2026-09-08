# CamposCSW

Editor visual de layout CSW (labels, campos `%CSLE`, displays e botões) para gerar coordenadas e tags.

Publicado via **GitHub Pages**.

## Uso

1. Defina o tamanho da tela (`AJ`) e se o layout é **Com Tab** ou **Sem Tab**.
2. Adicione itens pela paleta e posicione no canvas.
3. **Clique em um item** → o snippet aparece à direita e é **copiado automaticamente**:
   - **Campo** → `1000ON do ^%CSLE(LIN,COL,TAM,...)`
   - **Label** → `; csw:label:COL,LIN,TAM,Texto`
   - **Display** → `; csw:display:COL,LIN,TAM,ds1000`
4. Cole direto na `.mac`.

Não precisa baixar arquivo: o fluxo é clicar → copiar → colar.

### Regras aplicadas

- Limite de tela: até **108 × 28** (padrão atual)
- Tags `csw:label` / `csw:display` / `csw:botao`: **coluna, linha, tamanho**
- `%CSLE`: **linha, coluna, tamanho**
- Campo CSLE ocupa **TAM + 2** colunas na tela (colchetes `[ ]`)
- Snap de meia coluna (`12.5`, `18.5`, …)

## Exemplos rápidos

- **Exemplo com Tab** — monta o layout no estilo `PRGBTCOC000`
- **Exemplo sem Tab** — monta o layout no estilo `PRGBTCO610`

## GitHub Pages

No repositório:

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / pasta `/ (root)`
4. Salve e aguarde alguns minutos

URL esperada:

`https://rapidsoftservicos.github.io/CamposCSW/`

## Estrutura

```
CamposCSW/
├── index.html
├── css/styles.css
├── js/app.js
└── README.md
```

Site estático — sem build.
