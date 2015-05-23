/**
 * Created by XGHeaven on 2015/5/16.
 */

// test utils

var expect = require('chai').expect,
    utils = require('../src/utils'),
    pathToReg = utils.pathToReg,
    handlePath = utils.handlePath,
    extend = utils.extend,
    parseUrl = utils.parseUrl;

describe('utils test', function() {
    var pathReg = pathToReg('path/:to/:do');

    describe('for pathToReg,', function() {

        it ('if the path have same name should be return false', function(){
            expect(pathToReg('path/:to/:to')).to.equal(false);
            expect(pathToReg('/:to/:to')).to.equal(false);
            expect(pathToReg(':a/:a/:a')).to.equal(false);
        });

        it('if return reg is right', function() {
            expect(pathReg.name).to.deep.equal(['to','do']);
            expect(pathReg.reg.toString()).to.equal("/^path/(\\w*)/(\\w*)$/");
        });

        it('if have invalid char should return false', function() {
            expect(pathToReg('path/:to/(?<+asd)')).to.equal(false);
        });

    });

    describe('for handlePath', function() {
        it('if use return path for test get right argument', function(){
            var argu = handlePath("path/name/123",pathReg);
            expect(argu).to.deep.equal({
                to: 'name',
                do: '123'
            });
        });

        it('if use return path for test get fail argument', function() {
            var argu = handlePath('path/name/123/haha', pathReg);
            expect(argu).to.equal(false);
        });
    });

    describe('for extend', function() {
        it('should extend by one param', function() {
            expect(extend({},{a:1})).to.deep.equal({a:1});
            expect(extend({a:1},{a:2})).to.deep.equal({a:2});
        });

        it('should extend by more param', function() {
            expect(extend({},{a:1},{b:2})).to.deep.equal({a:1,b:2});
            expect(extend({a:1,b:1},{a:2},{b:2})).to.deep.equal({a:2,b:2});
        });
    })
});
