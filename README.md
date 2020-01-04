# vue-css-vars
> To use css variables in client side

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

### Usages
```bash
Vue.$cssVars // To load styles (variables)
Vue.$cssVars = ':root.default' // To set themes style (variables)
```

### Options
- onlyLegacy : Only legacy browser to use variables (because of IE)

```javascript
import cssVars from './cssVars';
Vue.use(cssVars, {
  onlyLegacy: True // Default : true (Only Support IE)
});
```
