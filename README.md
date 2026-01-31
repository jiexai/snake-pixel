# 像素贪吃蛇（网页小项目）

- 方向键 / WASD 控制
- 空格暂停
- R 重开
- 触摸：在画布上滑动改变方向（手机可玩）

## 运行方式

### 方式 1：直接打开
双击 `index.html` 即可运行（推荐用 Chrome）。

> 某些浏览器策略可能限制本地文件访问，但本项目纯前端不依赖外部资源，一般不会有问题。

### 方式 2：本地服务器（更推荐）

在项目目录执行：

```bash
cd snake-pixel
python3 -m http.server 5173
```

然后打开：

- http://127.0.0.1:5173/

## 结构

- `index.html` 页面
- `src/style.css` 样式
- `src/game.js` 游戏逻辑

## 自定义

在 `src/game.js` 里：
- `GRID` 控制棋盘格数（默认 28x28）
- `tickMsBase` 控制初始速度
