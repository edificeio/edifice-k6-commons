# edifice-k6-commons

## Généralités

Cette librairie fournit les fonctionnalités de base pour intéragir avec l'ENT via K6 (authentification, appels HTTP et WS, utilitaires de vérification des résultats, etc.).

## Initialisation

```shell
git clone git@github.com:edificeio/edifice-k6-commons.git
cd edifice-k6-commons
pnpm i
```
## Build

```shell
npm build
```

## Publication

Depuis les branches `main`, `develop` ou `develop-*` (branche de squad) modifier le numéro de version dans package.json puis exécuter la commande suivante.

```shell
./build.sh publish
```

Suite à la publication, pensez à mettre à jour les projets ayant besoin des modifications publiées :
- en faisant `pnpm up` pour les projets référençant une branche de développement
- en modifiant dans le package.json du projet impacté la version finale publiée


## Développement continu

Si vous voulez bénéficier dans votre script de tests de changements que vous êtes en train de réaliser en local sur la 
librairie edifice-k6-commons il faut :

1. créer un répertoire `commons` à un endroit accessible par le script de tests en ours d'écriture (n'importe où sur le fs si le test est lancé "nativement" mais à l'intérieur d'un volume du container k6 si le test est lancé via docker)
2. compiler edifice-k6-commons avec `pnpm build`
3. copier le fichier `dist/index.js` généré dans le répertorie `commons` créé plus haut
4. remplacer l'import `from "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/dist/index.js"` par `"path/to/commons/index.js"` là où vous en avez besoin


Exemple :
Si on est train de tester le script `entcore/tests/src/test/js/it/scenarios/position/attribute-position.js` dans entcore

```shell
cd $PROJECTS_DIR/edifice-k6-commons
<modification k6-commons>
pnpm run build
cd $PROJECTS_DIR/entcore
mkdir -p tests/src/test/js/commons
cp $PROJECTS_DIR/edifice-k6-commons/dist/index.js tests/src/test/js/commons/index.js
docker compose run --rm k6 run file:///home/k6/src/it/scenarios/position/attribute-position.js
```