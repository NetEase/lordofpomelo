#!/usr/bin/env bash

git add $(git status | grep 'modified:' | awk '{print $2}')
git add $(git status | grep 'new file:' | awk '{print $2}')
git add $(git status | grep 'deleted:' | awk '{print $2}')