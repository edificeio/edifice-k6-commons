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

1. builder le projet `edifice-k6-commons` en lançant `cd $PROJETS_DIR/edifice_k6_commons && pnpm run format && pnpm build`
2. copier le contenu du répertoire `dist` dans le répertorie `node_modules/edifice-k6-commons` du projet où se situent les tests ayant besoin des modifications en exécutant `cp $PROJETS_DIR/edifice_k6_commons/dist/* $PROJETS_DIR/my-project/node_modules/edifice-k6-commons/dist/`


Exemple :
Si on est train de tester le script `entcore/tests/src/test/js/it/scenarios/position/attribute-position.js` dans entcore

```shell
cd $PROJECTS_DIR/edifice-k6-commons
<modification k6-commons>
pnpm run build
cp $PROJECTS_DIR/edifice-k6-commons/dist/* $PROJECTS_DIR/entcore/tests/src/test/js/node_modules/edifice-k6-commons/dist/


docker compose run --rm k6 run --compatibility-mode=experimental_enhanced file:///home/k6/src/it/scenarios/position/attribute-position.js
```