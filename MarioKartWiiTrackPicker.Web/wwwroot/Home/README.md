This folder must be present to support service worker generation. 

The service worker generator in gulpfile.js uses this folder to simulate
the Home/Index route, so that it can mark the route for caching. Then the 
manifest.json uses Home/Index as the startup route.