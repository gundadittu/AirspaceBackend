# Airspace backend

Setting up Production Mode
- First, cd into "functions" directory
- $ npm run-script prod-setup
- firebase deploy --only functions:${function_name_goes_here}

Setting up Development Mode
- First, cd into "functions" directory
- $ npm run-script dev-setup

Deployment instructions 
- First, cd into "functions" directory
- To deploy a specific function: firebase deploy --only functions:${function_name_goes_here}
- To deploy all functions: $ npm run-scripts deploy

Common issues: 
- If you run into issues running the scripts, make sure they are executable (chmod +x ....)

-----
- prevent emailHelper from sending emails in development
- stripe, sendgrid, airtable development credentials

