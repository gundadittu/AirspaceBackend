cat deployment-config/development/firebase-setup.txt > ../.firebaserc

cat deployment-config/development/firebase-credentials.json > deployment-config/credentials.json

cat deployment-config/development/firebase-database.json > deployment-config/database.json

firebase functions:config:set sendgrid.key="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"