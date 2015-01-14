#!/bin/bash

TWITTER_USERNAME="$1"
TWITTER_PASSWORD="$2"

while read LINE
do
  
    echo "Reporting ${LINE}";

    phantomjs --ssl-protocol tlsv1 twitter-report-user-account.js "${TWITTER_USERNAME}" "${TWITTER_PASSWORD}" "${LINE}"
  
done < "$3"
