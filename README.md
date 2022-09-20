# star-px-to-viewport

It's a small tool based on postcss-px-to-viewport and tailwindcss
本项目基于[postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport) 修改

## 简介

如果你的样式需要做根据视口大小来调整宽度，这个脚本可以将你CSS中的px单位转化为vw，1vw等于1/100视口宽度。

由于原`postcss-px-to-viewport`项目不支持动态修改设计稿宽度尺寸 `viewportWidth` 故而对其进行简单修改。
使用可以配合[tailwindcss](https://www.tailwindcss.cn/)来达到更快的开发效率

在`JSX`中可以这样写，具体数值仅供参考

```
<div className="absolute left-0 top-0 z-50 h-[100px] w-[100px] bg-white sl:h-[100px] sl:w-[100px] xl:h-[100px] xl:w-[100px] lg:h-[100px] lg:w-[100px]  md:h-[100px] md:w-[100px] sm:h-[100px] sm:w-[100px]"></div>
```

在`tailwind.config.js`可以这样设置断点,具体设计稿数值可以自己配置并在设置postcss插件时传进去
```
theme: {
    screens: {
      sl: { max: "1440px" },
      xl: { max: "1280px" },
      lg: { max: "1024px" },
      md: { max: "750px" },
      sm: { max: "640px" },
    },
}
```
编译后会输出如下内容，具体根据自己输入的值产生变化
```
@media (max-width: 640px){
  .sm\:w-\[100px\] {
      width: 15.625vw;
  }
}
@media (max-width: 750px) {
  .md\:w-\[100px\] {
      width: 13.333333vw;
  }
}

@media (max-width: 1024px) {
  .lg\:w-\[100px\] {
      width: 9.765625vw;
  }
}

@media (max-width: 1280px) {
  .xl\:w-\[100px\] {
      width: 7.8125vw;
  }
}

@media (max-width: 1440px) {
  .sl\:w-\[100px\] {
      width: 6.944444vw;
  }
}

```

## 配置参数

默认参数:
```js
{
  unitToConvert: 'px',
  viewportWidth: 1920,
  viewportWidthSM: 640,
  viewportWidthMD: 750,
  viewportWidthLG: 1024,
  viewportWidthXL: 1280,
  viewportWidthSL: 1440,
  unitPrecision: 5,
  propList: ['*'],
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  selectorBlackList: [],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  exclude: [],
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568
}
```
- `unitToConvert` (String) 需要转换的单位，默认为"px"
- `viewportWidth` (Number) 设计稿的视口宽度
- `viewportWidthSM` (Number) sm设计稿的视口宽度
- `viewportWidthMD` (Number) md设计稿的视口宽度
- `viewportWidthLG` (Number) lg设计稿的视口宽度
- `viewportWidthXL` (Number) xl设计稿的视口宽度
- `viewportWidthSL` (Number) sl设计稿的视口宽度
- `unitPrecision` (Number) 单位转换后保留的精度
- `propList` (Array) 能转化为vw的属性列表
  - 传入特定的CSS属性；
  - 可以传入通配符"*"去匹配所有属性，例如：['*']；
  - 在属性的前或后添加"*",可以匹配特定的属性. (例如['*position*'] 会匹配 background-position-y)
  - 在特定属性前加 "!"，将不转换该属性的单位 . 例如: ['*', '!letter-spacing']，将不转换letter-spacing
  - "!" 和 "*"可以组合使用， 例如: ['*', '!font*']，将不转换font-size以及font-weight等属性
- `viewportUnit` (String) 希望使用的视口单位
- `fontViewportUnit` (String) 字体使用的视口单位
- `selectorBlackList` (Array) 需要忽略的CSS选择器，不会转为视口单位，使用原有的px等单位。
    - 如果传入的值为字符串的话，只要选择器中含有传入值就会被匹配
        - 例如 `selectorBlackList` 为 `['body']` 的话， 那么 `.body-class` 就会被忽略
    - 如果传入的值为正则表达式的话，那么就会依据CSS选择器是否匹配该正则
        - 例如 `selectorBlackList` 为 `[/^body$/]` , 那么 `body` 会被忽略，而 `.body` 不会
- `minPixelValue` (Number) 设置最小的转换数值，如果为1的话，只有大于1的值会被转换
- `mediaQuery` (Boolean) 媒体查询里的单位是否需要转换单位
- `replace` (Boolean) 是否直接更换属性值，而不添加备用属性
- `exclude` (Array or Regexp) 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
    - 如果值是一个正则表达式，那么匹配这个正则的文件会被忽略
    - 如果传入的值是一个数组，那么数组里的值必须为正则
- `landscape` (Boolean) 是否添加根据 `landscapeWidth` 生成的媒体查询条件 `@media (orientation: landscape)`
- `landscapeUnit` (String) 横屏时使用的单位
- `landscapeWidth` (Number) 横屏时使用的视口宽度

## 插件配置

在vite.config.ts中的配置
```
  import pxToVW from 'star-px-to-viewport';
  import tailwindcss from 'tailwindcss'
  import autoprefixer from 'autoprefixer'
```
```
css: {
  postcss: {
    plugins: [
      tailwindcss,
      autoprefixer,
      pxToVW({
        unitToConvert: 'px',
        viewportWidth: 1920,
        viewportWidthSM: 640,
        viewportWidthMD: 750,
        viewportWidthLG: 1024,
        viewportWidthXL: 1280,
        viewportWidthSL: 1440,
        unitPrecision: 6,
        propList: ['*'],
        viewportUnit: 'vw',
        fontViewportUnit: 'vw',
        selectorBlackList: ['ignore-'],
        minPixelValue: 1,
        mediaQuery: true,
        replace: true,
        // exclude: [/node_modules/],
        exclude: [],
        landscape: false
      }),
    ]
  }
},
```