# /usr/bin/env sh
FILE=discord.env
source $FILE
export $(cut -d= -f1 $FILE)
