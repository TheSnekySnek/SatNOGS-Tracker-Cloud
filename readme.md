# Cloud Setup

## Install nodejs

Install nvm:

```curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash```

Activate nvm:

```. ~/.nvm/nvm.sh```

Install Node LTS:

```nvm install --lts```

## Clone & install

Clone this repo:

```git clone https://github.com/TheSnekySnek/SatNOGS-Tracker-Cloud.git```

Install modules:

```cd SatNOGS-Tracker-Cloud```
```npm install```

## Install PM2 for startup
Install PM2:

```npm install pm2 -g```

Enable Startup(Follow the instructions):

```pm2 startup```

## Backend setup

Start the backend:

```pm2 start backend.js```

Save the process list:

```pm2 save```

## Frontend setup

Start the frontend:

```pm2 start web.js```

Save the process list:

```pm2 save```

## Required ENV variables
Write the following ENV variables to the .env file:

AWS_KEY=

AWS_SECRET=

BUCKET_NAME=

BACKEND_URL=

If you are deploying to google cloud add:

IS_GOOGLE=1