module.exports = {
  apps: [
    {
      name: 'PlantScNet_server',
      script: 'server/index.js',
      cwd: '/public/shiny/PlantScNet/PlantscNet_server',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 1116,
        PLANTSCNET_DATA_DIR: '/public/shiny/PlantScNet/PlantscNet_server/data',
      },
    },
  ],
}
