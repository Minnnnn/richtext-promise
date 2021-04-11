const promiseStatus = {
    PENDING:'PENDING',
    FULFILLED:'FULFILLED',
    REJECTED:'REJECTED'
}

class myPromise {
    constructor(myExecutorFunc) {
        if(typeof myExecutorFunc !=="function"){
            throw new Error('MyPromise only accept a functon handle!')
        }
        //添加状态
        this.status = promiseStatus.PENDING;
        //添加resolve值
        this.value = undefined;
        //存储then中成功的回调函数
        this.fulfilledsQueues = [];
        //存储catch中失败的回调函数
        this.rejectedsQueues =[];

        try{
            myExecutorFunc(this.resolve.bind(this),this.reject.bind(this));
        }
        catch (err){
            this.reject(err)
        }
    }
    resolve(val){
        //如果resolve参数是一个Promise，则必须等这个Promise对象状态改变后，当前Promise状态才能改变，且状态取决于参数中Promise对象的状态
        if(val instanceof  myPromise){
            return val.then(this.resolve,this.reject);
        }else {
            if (this.status !== promiseStatus.PENDING) return;
            this.status = promiseStatus.FULFILLED;
            this.value = val;
            this.fulfilledsQueues.forEach(fulFunc => fulFunc());
        }
    }
    reject(err){
        if(this.status !==promiseStatus.PENDING)return;
        this.status=promiseStatus.REJECTED;
        this.value=err;
        this.rejectedsQueues.forEach(rejFunc=>rejFunc());
    }
    //添加then方法
    then(onFulfilled,onRejected){
        //返回一个新的Promise对象
        return new myPromise((onFulfilledFunc,onRejectedFunc)=>{
            //封装一个成功时的执行函数
            let fulfilled = value =>{
                //处理then函数的异步问题
                setTimeout(()=>{
                    try{
                        if(typeof onFulfilled === "function") {
                            let res = onFulfilled(value);
                            if (res instanceof myPromise) {
                                //如果当前回调函数返回Promise对象，则继续调用then
                                res.then(onFulfilledFunc, onRejectedFunc);
                            } else {
                                //当前回调函数返回非Promise对象，则将结果传入下一个then的回调函数，并立即执行下一个then的回调函数
                                onFulfilledFunc(res);
                            }
                        }else {
                            //如果then缺少能够返回promise对象的函数时，链式调用就直接进行下一环操作
                            onFulfilledFunc(value);
                        }
                    }catch (err){
                        onRejectedFunc(err);
                    }
                });
            }
            //封装一个失败时的执行函数
            let rejected = error =>{
                //处理then函数的异步问题
                setTimeout(()=>{
                    try {
                        if(typeof onRejected === "function"){
                            let res = onRejected(error);
                            if(res instanceof myPromise){
                                res.then(onFulfilledFunc,onRejectedFunc);
                            }else{
                                onFulfilledFunc(res);
                            }
                        }else{
                            onRejectedFunc(error)
                        }
                    }catch (err){
                        onRejectedFunc(err);
                    }
                });
            }

            switch (this.status) {
                case promiseStatus.PENDING:
                    this.fulfilledsQueues.push(fulfilled);
                    this.rejectedsQueues.push(rejected);
                    break;
                case promiseStatus.FULFILLED:
                    fulfilled(this.value);
                    break;
                case promiseStatus.REJECTED:
                    rejected(this.value);
                    break;
            }
        })
    }
    //添加catch
    catch(onRejected){
        return this.then(undefined,onRejected);
    }

    //catch方法
    static all(promiseList){
        return new myPromise((resolve,reject)=>{
            let values= [];
            let count = promiseList.length;
            for(let i of promiseList){
               this.resolve(i).then(res => {
                   values.push(res);
                   --count
                   if(count<1)resolve(values);
               },reject)
            }
        })
    }

    //race方法
    static race(promiseList){
        return new myPromise((resolve,reject)=>{
            for(let i of promiseList){
                this.resolve(i).then(res=>{
                    resolve(res);
                },reject)
            }
        })
    }

    //添加静态resolve方法
    static resolve(val){
        if(val instanceof myPromise)return val;
        return new myPromise(resolve=>resolve(val));
    }
    //静态reject方法
    static reject(val){
        return new myPromise((resolve,reject)=>reject(val));
    }
}
