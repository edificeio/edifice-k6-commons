# edifice-k6-commons

## Généralités

Cette librairie fournit les fonctionnalités de base pour intéragir avec l'ENT via K6 (authentification, appels HTTP et WS, utilitaires de vérification des résultats, etc.).

## Initialisation

```shell
git clone git@github.com:edificeio/edifice-k6-commons.git
cd edifice-k6-commons
pnpm i
```

## Avant de commiter

```shell
pnpm format && pnpm run build
```

Attention : Il faut bien committer les fichiers index.js et index.umd.cjs car ils sont référencés par les scripts utilisant cette librairie.

## Développement continu

Si vous voulez bénéficier dans votre script de tests d'évolutions en cours sur la librairie edifice-k6-commons il faut :

1. remplacer `from "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/dist/index.js"` par `"../../../commons/index.js"` dans votre import de la librairie
2. recompiler avec `pnpm run build` après chaque modification de la librairie
3. copier le fichier `dist/index.js` généré à un endroit accessible par votre test

Exemple :
Si on est train de tester le script `entcore/tests/src/test/js/it/scenarios/position/attribute-position.js` dans entcore

```shell
<modification k6-commons>
pnpm run build
cd $PROJECTS_DIR/entcore
mkdir -p tests/src/test/js/commons
cp $PROJECTS_DIR/edifice-k6-commons/dist/index.js tests/src/test/js/commons/index.js
docker compose run --rm k6 run file:///home/k6/src/it/scenarios/position/attribute-position.js
```
