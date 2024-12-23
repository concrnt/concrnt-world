#! /bin/bash

if [ "$NODE_ENV" == "development" ]; then
    cp ./devpublic/* ./public/
fi


