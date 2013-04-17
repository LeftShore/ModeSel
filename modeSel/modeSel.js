/**
 * @brif dom处理工具集
 * @return object
 */
var base = (function() {
    var exports = {
        $ : function(id){
            return (typeof id == "string" ? document.getElementById(id) : null)
        }
    };
    //html5 data-*兼容工具
    exports.data = function(dom, suffix, val){
        var isSupport = Boolean(dom.dataset),
            prefix = "data-";
        if (arguments.length == 3) {
            isSupport ? (dom.dataset[suffix] = val) : dom.setAttribute(prefix + suffix, val);
        }

        return isSupport ? dom.dataset[suffix] : dom.getAttribute(prefix + suffix);
    }
    //简单事件兼容工具
    exports.addEvent = function(dom, type, fn){
        if(dom.attachEvent){
            exports.addEvent = function(dom, type, fn){
                dom['e' + type + fn] = fn;
                dom[type + fn] = function(){dom['e' + type + fn](window.event)};
                dom.attachEvent('on' + type,dom[type + fn]);
            }
        }
        else{
            exports.addEvent = function(dom, type, fn){
                dom.addEventListener(type,fn,false)
            }
        }
        exports.addEvent(dom, type, fn);
    }
    exports.inArray = function(arr, val){
        if (arr.indexOf){
            return Boolean(~arr.indexOf(val));
        }
        for (var i = arr.length; i;) {
            if (arr[--i] === val) return true;
        }
        return false;
    }
    return exports;
})();

/**
 * @brif 简易模式状态选择类
 * @param {string} tableId  复选框所在的表id
 * @param {string} checkboxName 复选框的name
 * @param {string} triggerContainerId  命令触发器的dom容器id
 * @return object
 */
function ModeSel(tableId, checkboxName, triggerContainerId) {
    this.checkboxName = checkboxName;
    this.table = base.$(tableId);
    this.triggerContainer = base.$(triggerContainerId);
    this.mails = document.getElementsByName(checkboxName);
    //快捷键功能扩展列表
    this.keyExpand = [];
    //上一次勾选上的的checkbox的序列,-1为无
    this.lastSelectedIdx = -1;
    //缓存各命令对应checkbox理想状态
    this.criteria = (function(me){
        var mails = me.mails
            ,i = mails.length
            ,curmail
            ,_all = [], _read = [], _unread = [], _attachment = [];
        while (i){
            curmail = mails[--i];
            _all[i] = true;
            //                           ‘0’ ‘1’转为number型
            _unread[i] = !(_read[i] = !!+base.data(curmail, "read"));
            _attachment[i] = !!+base.data(curmail, "attachment");
        }
        var ret = {
            all : _all
            ,read : _read
            ,unread : _unread
            ,attachment : _attachment
        }
        return ret;
    })(this);
    this.init();
}

ModeSel.prototype = {
    constructor : ModeSel
    //初始化控制器
    ,init : function(){
        var me = this;
        //添加shift多选功能
        this.addShift();
        base.addEvent(this.triggerContainer, 'click', function(e){
            var target = e.target || e.srcElement;
            if (target.nodeName.toLowerCase() != "input"){
                return;
            }
            var type = target.id
                ,checkRet = me.checkStatus(type);
            //如果所有checkbox勾选状态均已符合命令，则反选
            me.statusTransfer(type, checkRet ? "reverse" : undefined);
            me.lastSelectedIdx = -1;
        })
    }
    //检测所有checkbox勾选状态是否符合命令
    //@param {string} type "all"|"read"|"unread"|"attachment"
    ,checkStatus : function(type){
        var mails = this.mails
            ,i = mails.length
            ,criteria = this.criteria[type]
            ,isChecked;
        for (; i;) {
            isChecked = mails[--i].checked;
            //比较dom选择状态和标准态
            if (isChecked != criteria[i]){
                return false;
            }
        }

        return true;
    }
    //处理checkbox的标签属性
    ,statusTransfer : function(type, command){
        var mails = this.mails
            ,criteria = this.criteria[type]
            ,i = mails.length;
        for (; i;) {
            var curCriteria = criteria[--i];
            if ("reverse" == command){
                curCriteria && (mails[i].checked = false);
            } else if (curCriteria != mails[i].checked){
                mails[i].checked = curCriteria;
            }
        }
    }
    ,addShift : function(){
        function multipleSel() {
            var me = this
                ,tbody = this.table.getElementsByTagName("tbody")[0];
            base.addEvent(tbody, "click", function(e){
                var target = e.target || e.srcElement;
                //点击元素name属性不符，返回
                if (target.name != me.checkboxName) return;
                var isChecked = target.checked
                    ,curidx = +base.data(target, "idx")
                    ,lastidx = me.lastSelectedIdx
                    ,i = lastidx;
                //按下shift 且 点击后呈选中态 且 上一次是有效选中点击
                if (e.shiftKey && isChecked && lastidx > -1){
                    while (true){
                        me.mails[i].checked = true;
                        //判断用户前后两次点击的checkbox是顺序还是倒序
                        i += lastidx < curidx ? 1 : -1;
                        // lastidx < curidx ? i++ : i--;
                        if (i == curidx) break;
                    }
                }
                //若click将该checkbox置于选中状态，则更新lastSelectedIdx
                me.lastSelectedIdx = isChecked ? curidx : -1;                
            })
        }
        //扩展shift功能
        var ret = this.expandShortcuts("shift", multipleSel);
        if (!ret){
            throw new Error("扩展快捷键功能有重名，扩展失败，请检查历史添加情况");
        }
    }

    /**
     * @brif 快捷键功能扩展接口
     * @param {string} key 键位名
     * @param {function} func 功能体
     * @return {Boolean} 扩展是否添加成功
     */    
    ,expandShortcuts : function(key, func){
        //若有功能同名，返回false，添加失败
        if (base.inArray(this.keyExpand, key)) return false;
        this.keyExpand.push(key);
        //修正上下文
        func.call(this);
        return true;
    }
};

