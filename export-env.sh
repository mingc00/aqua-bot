#!/bin/bash
env_file=discord.env
. $env_file
export $(cut -d= -f1 $env_file)
