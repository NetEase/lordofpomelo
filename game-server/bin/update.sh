#!/bin/sh
git reset public HEAD^
git checkout public
cd ../ && git pull
