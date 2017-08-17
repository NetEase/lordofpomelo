#pomelo-robot-demo

[Usage](https://github.com/NetEase/pomelo/wiki/PomeloRobot-%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3)

首先在lordofpomelo中注册一个新用户, 用户名用"pomeloXXX"(如:"pomelo1"), 密码用"pomelo".
在WEB页面中, 不要修改"Per Client Agents"的值, 在"Per Agents Users"一栏中填入"1"(表示自动登录"1"个角色; 如需自动登录多个角色, 则需要创建相应数量的角色才行, 具体参考"./app/data/mysql.js"中的代码).



### 更新声明

pomelo 更新到2.2.5版本
pomelo nodejs client 使用了 pomelo-nodejsclient-websocket : https://www.npmjs.com/package/pomelo-nodejsclient-websocket

### 使用说明
如果你是第一次使用robot, 首先要打开 lord.js中的 createRobotPlayer()方法 , 生成本地机器人数据

1: 打开lord.js simulateRealPlayer() 方法
2: node app.js master 开启master
3: node app.js client 开启客户端
4: 打开localhost:8889 RUN 
