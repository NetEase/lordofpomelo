#!/bin/sh
kill -9 `ps -ef|grep node | awk '{print $2}'`
