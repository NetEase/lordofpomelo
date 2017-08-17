/**
 * Created by lixiaodong on 17/3/4.
 */

function UserManager() {
    this.count = 0;
}

UserManager.prototype.update = function () {
    this.count++;
    return this.count;
}


module.exports = new UserManager();