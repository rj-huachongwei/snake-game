# 贪吃蛇 Snake Game

一个基于原生 HTML5 + CSS3 + JavaScript 实现的贪吃蛇网页游戏，无需任何依赖。

## 如何运行

直接用浏览器打开 `index.html` 即可。无需服务器，无需安装任何依赖。

```bash
# 方式一：直接双击打开
open index.html

# 方式二：使用本地服务器（可选）
npx serve .
# 或
python3 -m http.server 8080
```

## 操作说明

| 按键 | 功能 |
|------|------|
| ↑ / W | 向上移动 |
| ↓ / S | 向下移动 |
| ← / A | 向左移动 |
| → / D | 向右移动 |
| 空格键 | 暂停 / 继续 |
| Enter | 开始游戏 |

## 功能特性

- 🎮 方向键 & WASD 双控制方案
- 🏆 最高分持久化（localStorage）
- ⚡ 速度随得分自动提升（每 10 分加速一档）
- 💀 游戏结束弹窗，支持一键重玩
- ⏸ 暂停 / 继续功能
- 🎨 深色主题，渐变配色，Canvas 流畅渲染

## 文件结构

```
result/
├── index.html   # 游戏主页面（HTML 结构 + 布局）
├── style.css    # 样式文件（深色主题 + 动画）
├── game.js      # 游戏逻辑（Canvas 渲染、碰撞检测、速度控制）
└── README.md    # 本文档
```

## 技术栈

- HTML5 Canvas（游戏渲染）
- CSS3（动画、渐变、Glass 效果）
- 原生 JavaScript（ES2020+）
