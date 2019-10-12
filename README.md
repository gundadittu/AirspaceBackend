# Airspace backend

Setting up Production Mode
- First, cd into "functions" directory
- $ npm run-script prod-setup
- firebase deploy --only functions:${function_name_goes_here}
- NOTE: If asked for a password in terminal, enter your computer's password (this is for permission to modify file structure locally)

Setting up Development Mode
- First, cd into "functions" directory
- $ npm run-script dev-setup
- NOTE: If asked for a password in terminal, enter your computer's password (this is for permission to modify file structure locally)

Deployment instructions 
- First, cd into "functions" directory
- To deploy a specific function: firebase deploy --only functions:${function_name_goes_here}
- To deploy all functions: $ npm run-scripts deploy

Common issues: 
- If you run into issues running the scripts, make sure they are executable (chmod +x ....)

To-do: 
- configure sendgrid for devo mode + prevent emailHelper from sending emails in development
- configure stripe for devo mode
- configure airtable for devo mode 


