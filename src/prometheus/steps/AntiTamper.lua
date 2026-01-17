-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- AntiTamper.lua
--
-- This Script provides an Obfuscation Step, that breaks the script, when someone tries to tamper with it.
-- Enhanced with: scattered checks, silent corruption mode, LuaU-safe mode, environment validation, metamethod validation

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local RandomStrings = require("prometheus.randomStrings")
local Parser = require("prometheus.parser");
local Enums = require("prometheus.enums");
local visitast = require("prometheus.visitast");
local logger = require("logger");

local AstKind = Ast.AstKind;

local AntiTamper = Step:extend();
AntiTamper.Description = "This Step Breaks your Script when it is modified. Enhanced with scattered checks, silent corruption, and LuaU support.";
AntiTamper.Name = "Anti Tamper";

AntiTamper.SettingsDescriptor = {
    UseDebug = {
        type = "boolean",
        default = true,
        description = "Use debug library. (Recommended, however scripts will not work without debug library.)"
    },
    LuaUSafe = {
        type = "boolean",
        default = false,
        description = "Use LuaU-safe checks only (no debug library, works in Roblox)."
    },
    SilentCorruption = {
        type = "boolean",
        default = false,
        description = "Instead of error(), silently corrupt execution to waste attacker time."
    },
    ScatterChecks = {
        type = "boolean",
        default = true,
        description = "Scatter anti-tamper checks across multiple functions instead of one block."
    },
    CheckCount = {
        type = "number",
        default = 5,
        min = 1,
        max = 20,
        description = "Number of scattered check points to inject (when ScatterChecks is enabled)."
    },
    EnvironmentValidation = {
        type = "boolean",
        default = true,
        description = "Validate that critical globals haven't been tampered with."
    },
    MetamethodValidation = {
        type = "boolean",
        default = true,
        description = "Validate that metatables are intact."
    }
}

function AntiTamper:init(settings)
end

local function generateCorruptionCode(silent)
    if silent then
        return [[
            local __c_idx = 0;
            local __c_tbl = {};
            local __c_corrupt = function()
                __c_idx = __c_idx + (__c_idx % 7) + 1;
                __c_tbl[__c_idx] = function() return __c_tbl[(__c_idx + 3) % 11] end;
                rawset(_G, "__x" .. tostring(__c_idx), __c_tbl);
            end;
            local __c_apply = function(v)
                if not v then
                    for i = 1, math.random(3, 7) do __c_corrupt() end;
                    local mt = {
                        __index = function() return __c_corrupt end,
                        __newindex = function() __c_corrupt() end,
                        __call = function() return nil, __c_corrupt end,
                        __add = function() return 0/0 end,
                        __sub = function() return 0/0 end,
                        __mul = function() return 0/0 end,
                        __div = function() return 0/0 end,
                        __tostring = function() return "" end,
                        __len = function() return math.random(-999, 999) end,
                    };
                    pcall(function()
                        setmetatable(_G, mt);
                    end);
                end
            end;
        ]]
    else
        return [[
            local __tamper_err = function() error("Tamper Detected!") end;
            local __c_apply = function(v) if not v then __tamper_err() end end;
        ]]
    end
end

local function generateEnvValidation()
    return [[
        local __env_valid = true;
        local __orig_type = type;
        local __orig_tostring = tostring;
        local __orig_tonumber = tonumber;
        local __orig_pairs = pairs;
        local __orig_ipairs = ipairs;
        local __orig_next = next;
        local __orig_select = select;
        local __orig_pcall = pcall;
        local __orig_setmetatable = setmetatable;
        local __orig_getmetatable = getmetatable;
        local __orig_rawget = rawget;
        local __orig_rawset = rawset;
        local __orig_rawequal = rawequal;
        
        local __check_native = function(f, name)
            if __orig_type(f) ~= "function" then
                return false;
            end
            local info_ok, info = __orig_pcall(function()
                local s = __orig_tostring(f);
                return s:find("builtin") or s:find("native") or s:find("function:");
            end);
            return info_ok and info;
        end;
        
        __env_valid = __env_valid and __check_native(type, "type");
        __env_valid = __env_valid and __check_native(tostring, "tostring");
        __env_valid = __env_valid and __check_native(pairs, "pairs");
        __env_valid = __env_valid and __check_native(pcall, "pcall");
        __env_valid = __env_valid and __check_native(error, "error");
        
        local __str_valid = true;
        __str_valid = __str_valid and __orig_type(string) == "table";
        __str_valid = __str_valid and __check_native(string.sub, "string.sub");
        __str_valid = __str_valid and __check_native(string.byte, "string.byte");
        __str_valid = __str_valid and __check_native(string.char, "string.char");
        __str_valid = __str_valid and __check_native(string.len, "string.len");
        __env_valid = __env_valid and __str_valid;
        
        local __math_valid = true;
        __math_valid = __math_valid and __orig_type(math) == "table";
        __math_valid = __math_valid and __check_native(math.floor, "math.floor");
        __math_valid = __math_valid and __check_native(math.random, "math.random");
        __env_valid = __env_valid and __math_valid;
        
        local __tbl_valid = true;
        __tbl_valid = __tbl_valid and __orig_type(table) == "table";
        __tbl_valid = __tbl_valid and __check_native(table.insert, "table.insert");
        __tbl_valid = __tbl_valid and __check_native(table.remove, "table.remove");
        __env_valid = __env_valid and __tbl_valid;
        
        __c_apply(__env_valid);
    ]]
end

local function generateMetamethodValidation()
    return [[
        local __meta_valid = true;
        local __test_tbl = {};
        local __test_str = "test";
        
        local __mt_check = function()
            local ok, result = pcall(function()
                local mt = getmetatable(__test_str);
                if mt then
                    if type(mt.__index) ~= "table" and type(mt.__index) ~= "function" then
                        return false;
                    end
                end
                return true;
            end);
            return ok and result;
        end;
        __meta_valid = __meta_valid and __mt_check();
        
        local __num_mt_check = function()
            local ok, result = pcall(function()
                local n = 42;
                local mt = getmetatable(n);
                return mt == nil;
            end);
            return ok and result;
        end;
        __meta_valid = __meta_valid and __num_mt_check();
        
        local __tbl_mt_check = function()
            local ok, result = pcall(function()
                local t = {};
                local mt = {__index = function() return "indexed" end};
                setmetatable(t, mt);
                return t.nonexistent == "indexed";
            end);
            return ok and result;
        end;
        __meta_valid = __meta_valid and __tbl_mt_check();
        
        local __protect_check = function()
            local ok, result = pcall(function()
                local t = setmetatable({}, {
                    __metatable = "protected",
                });
                local mt = getmetatable(t);
                return mt == "protected";
            end);
            return ok and result;
        end;
        __meta_valid = __meta_valid and __protect_check();
        
        __c_apply(__meta_valid);
    ]]
end

local function generateLuaUSafeChecks()
    return [[
        local __luau_valid = true;
        
        local __pcall_check = function()
            local ok1, r1 = pcall(function() return 42 end);
            local ok2, r2 = pcall(function() error("test") end);
            return ok1 and r1 == 42 and not ok2;
        end;
        __luau_valid = __luau_valid and __pcall_check();
        
        local __type_check = function()
            return type("") == "string" and type(0) == "number" and 
                   type({}) == "table" and type(function()end) == "function" and
                   type(nil) == "nil" and type(true) == "boolean";
        end;
        __luau_valid = __luau_valid and __type_check();
        
        local __string_check = function()
            local s = "hello";
            return #s == 5 and s:sub(1,2) == "he" and s:byte(1) == 104;
        end;
        __luau_valid = __luau_valid and __string_check();
        
        local __math_check = function()
            return math.floor(3.7) == 3 and math.abs(-5) == 5 and
                   math.max(1,2,3) == 3 and math.min(1,2,3) == 1;
        end;
        __luau_valid = __luau_valid and __math_check();
        
        local __table_check = function()
            local t = {1, 2, 3};
            table.insert(t, 4);
            return #t == 4 and t[4] == 4;
        end;
        __luau_valid = __luau_valid and __table_check();
        
        local __closure_check = function()
            local x = 0;
            local f = function() x = x + 1; return x end;
            f(); f();
            return x == 2 and f() == 3;
        end;
        __luau_valid = __luau_valid and __closure_check();
        
        local __select_check = function()
            local function test(...)
                return select("#", ...) == 3 and select(2, ...) == "b";
            end
            return test("a", "b", "c");
        end;
        __luau_valid = __luau_valid and __select_check();
        
        __c_apply(__luau_valid);
    ]]
end

local function generateDebugChecks(randomStr)
    return [[
        local __debug_valid = true;
        local __sethook = debug and debug.sethook or function() end;
        local __allowedLine = nil;
        local __called = 0;
        __sethook(function(s, line)
            if not line then return end
            __called = __called + 1;
            if __allowedLine then
                if __allowedLine ~= line then
                    __sethook(error, "l", 5);
                end
            else
                __allowedLine = line;
            end
        end, "l", 5);
        (function() end)();
        (function() end)();
        __sethook();
        if __called < 2 then __debug_valid = false; end

        local __funcs = {pcall, string.char, debug.getinfo, string.dump};
        for i = 1, #__funcs do
            if debug.getinfo(__funcs[i]).what ~= "C" then
                __debug_valid = false;
            end
            if debug.getlocal(__funcs[i], 1) then
                __debug_valid = false;
            end
            if debug.getupvalue(__funcs[i], 1) then
                __debug_valid = false;
            end
            if pcall(string.dump, __funcs[i]) then
                __debug_valid = false;
            end
        end

        local function __getTraceback()
            local str = (function(arg)
                return debug.traceback(arg)
            end)("]] .. randomStr .. [[");
            return str;
        end

        local __traceback = __getTraceback();
        __debug_valid = __debug_valid and __traceback:sub(1, __traceback:find("\n") - 1) == "]] .. randomStr .. [[";
        local __iter = __traceback:gmatch(":(%d*):");
        local __v, __c = __iter(), 1;
        for i in __iter do
            __debug_valid = __debug_valid and i == __v;
            __c = __c + 1;
        end
        __debug_valid = __debug_valid and __c >= 2;
        
        __c_apply(__debug_valid);
    ]]
end

local function generateScatteredCheck(checkIndex, silent)
    local checks = {
        function()
            local key = RandomStrings.randomString(8);
            local expected = math.random(1000, 9999);
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_key = "%s";
                local __sc%d_expected = %d;
                local __sc%d_computed = 0;
                for i = 1, #__sc%d_key do
                    __sc%d_computed = (__sc%d_computed + string.byte(__sc%d_key, i)) %% 10000;
                end
                local __sc%d_real = 0;
                for i = 1, #"%s" do
                    __sc%d_real = (__sc%d_real + string.byte("%s", i)) %% 10000;
                end
                __sc%d_valid = __sc%d_computed == __sc%d_real;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, key, checkIndex, expected, checkIndex, checkIndex, 
                checkIndex, checkIndex, checkIndex, checkIndex, key, checkIndex, checkIndex, key,
                checkIndex, checkIndex, checkIndex, checkIndex);
        end,
        
        function()
            local a, b = math.random(1, 100), math.random(1, 100);
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_a, __sc%d_b = %d, %d;
                local __sc%d_sum = __sc%d_a + __sc%d_b;
                local __sc%d_check = function(x, y) return x + y end;
                __sc%d_valid = __sc%d_sum == __sc%d_check(__sc%d_a, __sc%d_b);
                __sc%d_valid = __sc%d_valid and __sc%d_sum == %d;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, checkIndex, a, b, checkIndex, checkIndex, checkIndex,
                checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex,
                checkIndex, checkIndex, checkIndex, a + b, checkIndex);
        end,
        
        function()
            local str = RandomStrings.randomString(10);
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_str = "%s";
                local __sc%d_len = #__sc%d_str;
                __sc%d_valid = __sc%d_len == %d;
                __sc%d_valid = __sc%d_valid and __sc%d_str:sub(1,1) == "%s";
                __sc%d_valid = __sc%d_valid and __sc%d_str:sub(-1) == "%s";
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, str, checkIndex, checkIndex, checkIndex, checkIndex, 
                #str, checkIndex, checkIndex, checkIndex, str:sub(1,1), checkIndex, checkIndex, 
                checkIndex, str:sub(-1), checkIndex);
        end,
        
        function()
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_t = {a = 1, b = 2, c = 3};
                local __sc%d_count = 0;
                for k, v in pairs(__sc%d_t) do
                    __sc%d_count = __sc%d_count + v;
                end
                __sc%d_valid = __sc%d_count == 6;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex,
                checkIndex, checkIndex, checkIndex);
        end,
        
        function()
            local n = math.random(5, 15);
            local expected = (n * (n + 1)) / 2;
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_n = %d;
                local __sc%d_sum = 0;
                for i = 1, __sc%d_n do
                    __sc%d_sum = __sc%d_sum + i;
                end
                __sc%d_valid = __sc%d_sum == %d;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, n, checkIndex, checkIndex, checkIndex, checkIndex,
                checkIndex, checkIndex, math.floor(expected), checkIndex);
        end,
        
        function()
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_mt = {
                    __call = function(t, x) return x * 2 end
                };
                local __sc%d_obj = setmetatable({}, __sc%d_mt);
                __sc%d_valid = __sc%d_obj(21) == 42;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex);
        end,
        
        function()
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_f = function(...)
                    return select("#", ...);
                end;
                __sc%d_valid = __sc%d_f(1, 2, 3, 4, 5) == 5;
                __sc%d_valid = __sc%d_valid and __sc%d_f() == 0;
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex);
        end,
        
        function()
            return string.format([[
                local __sc%d_valid = true;
                local __sc%d_co = coroutine.create(function() return 42 end);
                if __sc%d_co then
                    local __sc%d_ok, __sc%d_val = coroutine.resume(__sc%d_co);
                    __sc%d_valid = __sc%d_ok and __sc%d_val == 42;
                end
                __c_apply(__sc%d_valid);
            ]], checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex, checkIndex);
        end,
    };
    
    local checkFunc = checks[((checkIndex - 1) % #checks) + 1];
    return checkFunc();
end

local function generateIntegrityCheck(silent)
    local rand1 = tostring(math.random(1, 2^24));
    local randStr1 = RandomStrings.randomString();
    local rand2 = tostring(math.random(1, 2^24));
    local randStr2 = RandomStrings.randomString();
    local rand3 = tostring(math.random(1, 2^24));
    local randStr3 = RandomStrings.randomString();
    local rand4 = tostring(math.random(1, 2^24));
    local randStr4 = RandomStrings.randomString();
    
    return [[
        local __int_valid = true;
        local __gmatch = string.gmatch;

        local __pcallIntact2 = false;
        local __pcallIntact = pcall(function()
            __pcallIntact2 = true;
        end) and __pcallIntact2;
        __int_valid = __int_valid and __pcallIntact;

        local __random = math.random;
        local __tblconcat = table.concat;
        local __unpkg = table and table.unpack or unpack;
        local __n = __random(3, 65);
        local __acc1 = 0;
        local __acc2 = 0;
        local __pcallRet = {pcall(function() local a = ]] .. rand1 .. [[ - "]] .. randStr1 .. [[" ^ ]] .. rand2 .. [[ return "]] .. randStr2 .. [[" / a; end)};
        local __origMsg = __pcallRet[2];
        local __line = tonumber(__gmatch(tostring(__origMsg), ':(%d*):')());
        for i = 1, __n do
            local len = __random(1, 100);
            local n2 = __random(0, 255);
            local pos = __random(1, len);
            local shouldErr = __random(1, 2) == 1;
            local msg = __origMsg:gsub(':(%d*):', ':' .. tostring(__random(0, 10000)) .. ':');
            local arr = {pcall(function()
                if __random(1, 2) == 1 or i == __n then
                    local line2 = tonumber(__gmatch(tostring(({pcall(function() local a = ]] .. rand3 .. [[ - "]] .. randStr3 .. [[" ^ ]] .. rand4 .. [[ return "]] .. randStr4 .. [[" / a; end)})[2]), ':(%d*):')());
                    __int_valid = __int_valid and __line == line2;
                end
                if shouldErr then
                    error(msg, 0);
                end
                local arr = {};
                for i = 1, len do
                    arr[i] = __random(0, 255);
                end
                arr[pos] = n2;
                return __unpkg(arr);
            end)};
            if shouldErr then
                __int_valid = __int_valid and arr[1] == false and arr[2] == msg;
            else
                __int_valid = __int_valid and arr[1];
                __acc1 = (__acc1 + (arr[pos + 1] or 0)) % 256;
                __acc2 = (__acc2 + n2) % 256;
            end
        end
        __int_valid = __int_valid and __acc1 == __acc2;
        
        __c_apply(__int_valid);

        local __trap_obj = setmetatable({}, {
            __tostring = function() __c_apply(false) end,
        });
        __trap_obj[__random(1, 100)] = __trap_obj;
        (function() end)(__trap_obj);

        repeat until __int_valid;
    ]]
end

function AntiTamper:collectFunctionBlocks(ast)
    local blocks = {};
    
    visitast(ast, function(node, data)
        if node.kind == AstKind.FunctionLiteralExpression or
           node.kind == AstKind.FunctionDeclaration or
           node.kind == AstKind.LocalFunctionDeclaration then
            if node.body and node.body.statements and #node.body.statements > 0 then
                table.insert(blocks, node.body);
            end
        end
        if node.kind == AstKind.DoStatement and node.body and node.body.statements then
            table.insert(blocks, node.body);
        end
        if node.kind == AstKind.WhileStatement and node.body and node.body.statements then
            table.insert(blocks, node.body);
        end
        if node.kind == AstKind.ForStatement and node.body and node.body.statements then
            table.insert(blocks, node.body);
        end
        if node.kind == AstKind.ForInStatement and node.body and node.body.statements then
            table.insert(blocks, node.body);
        end
    end);
    
    return blocks;
end

function AntiTamper:injectScatteredChecks(ast, checkCount, silent)
    local blocks = self:collectFunctionBlocks(ast);
    
    if #blocks == 0 then
        return;
    end
    
    local shuffled = {};
    for i, block in ipairs(blocks) do
        shuffled[i] = block;
    end
    for i = #shuffled, 2, -1 do
        local j = math.random(1, i);
        shuffled[i], shuffled[j] = shuffled[j], shuffled[i];
    end
    
    for i = 1, math.min(checkCount, #shuffled) do
        local block = shuffled[i];
        local checkCode = generateScatteredCheck(i, silent);
        
        local parsed = Parser:new({LuaVersion = Enums.LuaVersion.Lua51}):parse("do " .. checkCode .. " end");
        local doStat = parsed.body.statements[1];
        doStat.body.scope:setParent(block.scope);
        
        local insertPos = math.random(1, math.max(1, #block.statements));
        table.insert(block.statements, insertPos, doStat);
    end
end

function AntiTamper:apply(ast, pipeline)
    if pipeline.PrettyPrint then
        logger:warn(string.format("\"%s\" cannot be used with PrettyPrint, ignoring \"%s\"", self.Name, self.Name));
        return ast;
    end
    
    local useLuaU = self.LuaUSafe;
    local useDebug = self.UseDebug and not useLuaU;
    local silent = self.SilentCorruption;
    local scatter = self.ScatterChecks;
    local checkCount = self.CheckCount or 5;
    local envValidation = self.EnvironmentValidation;
    local metaValidation = self.MetamethodValidation;
    
    local code = "do ";
    
    code = code .. generateCorruptionCode(silent);
    
    if envValidation then
        code = code .. generateEnvValidation();
    end
    
    if metaValidation then
        code = code .. generateMetamethodValidation();
    end
    
    if useLuaU then
        code = code .. generateLuaUSafeChecks();
    elseif useDebug then
        local randomStr = RandomStrings.randomString();
        code = code .. generateDebugChecks(randomStr);
    end
    
    code = code .. generateIntegrityCheck(silent);
    
    code = code .. " end";
    
    local parsed = Parser:new({LuaVersion = Enums.LuaVersion.Lua51}):parse(code);
    local doStat = parsed.body.statements[1];
    doStat.body.scope:setParent(ast.body.scope);
    table.insert(ast.body.statements, 1, doStat);
    
    if scatter then
        self:injectScatteredChecks(ast, checkCount, silent);
    end
    
    return ast;
end

return AntiTamper;
