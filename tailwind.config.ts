module.exports = {
  // 扫描哪些文件
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

  // 自定义主题
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
      },
    },
  },

  darkmode: 'class',

  // 添加插件（需要先npm安装）
  plugins: [require('@tailwindcss/typography')],
}
