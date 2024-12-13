#!/bin/bash

set -e

function get_tag_from_branch() {
  # Get the current branch name
  local branch_name
  branch_name=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  # Check if the branch is 'main'
  if [[ "$branch_name" == "main" ]]; then
    echo "latest"
  elif [[ "$branch_name" == "develop" ]]; then
      echo "$branch_name"
  elif [[ "$branch_name" == develop-* ]]; then
    echo "$branch_name"
  else
    # Return -1 for all other cases
    echo "na"
  fi
}

function publish() {
  pnpm format
  pnpm build
  tag=$(get_tag_from_branch)
  if [[ "$tag" == "na" ]]; then
    echo "can only deploy from main, develop or a develop-squad branch"
    return -1
  fi
  pnpm publish --tag $tag --no-git-checks --access public
}

for param in "$@"
do
  case $param in
    publish)
      publish
      ;;
    *)
      echo "Invalid argument : $param"
  esac
  if [ ! $? -eq 0 ]; then
    exit 1
  fi
done
