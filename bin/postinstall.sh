#!/bin/sh

# here we check if this script was not yet executed, if it's a first run, then install this package dependecies
# otherwise we would get into an infinite loop
if [ ! -f "../../serverless.yml" ]
then
    cp serverlessExample.yml ../../serverless.yml
	#npm install
fi
