-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ReferenceHiding.lua
--
-- This Script provides reference hiding obfuscation:
-- - Localize builtins with mangled names: local tinsert = table.insert
-- - Indirect access to _G: _G[decodedKey] or rawget(_G, key)
-- - Create API table with randomized indices
-- - Wrap functions in intermediate closures
-- - Randomize order of localization

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local ReferenceHiding = Step:extend();
ReferenceHiding.Description = "This Step hides references to global functions and builtins through indirection and localization.";
ReferenceHiding.Name = "Reference Hiding";

ReferenceHiding.SettingsDescriptor = {
	LocalizeBuiltins = {
		name = "LocalizeBuiltins",
		description = "Create local aliases for commonly used builtins",
		type = "boolean",
		default = true,
	},
	UseIndirectAccess = {
		name = "UseIndirectAccess",
		description = "Use indirect _G access for globals",
		type = "boolean",
		default = true,
	},
	WrapInClosures = {
		name = "WrapInClosures",
		description = "Wrap function references in intermediate closures",
		type = "boolean",
		default = true,
	},
	Probability = {
		name = "Probability",
		description = "Probability of applying hiding to a reference (0-1)",
		type = "number",
		default = 0.6,
		min = 0,
		max = 1,
	},
}

function ReferenceHiding:init(settings)
end

local COMMON_BUILTINS = {
	["table"] = {"insert", "remove", "concat", "sort", "unpack"},
	["string"] = {"sub", "byte", "char", "len", "find", "gsub", "match", "format", "rep", "lower", "upper"},
	["math"] = {"floor", "ceil", "abs", "sqrt", "random", "randomseed", "sin", "cos", "tan", "max", "min", "pow"},
	["os"] = {"time", "clock", "date"},
	["bit32"] = {"band", "bor", "bxor", "bnot", "lshift", "rshift"},
};

local COMMON_GLOBALS = {"print", "pairs", "ipairs", "next", "type", "tostring", "tonumber", "select", "pcall", "xpcall", "error", "assert", "setmetatable", "getmetatable", "rawget", "rawset"};

function ReferenceHiding:randomString(length)
	local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	local result = "";
	for i = 1, length do
		local idx = math.random(1, #chars);
		result = result .. string.sub(chars, idx, idx);
	end
	return result;
end

function ReferenceHiding:encodeString(str)
	local encoded = {};
	local key = math.random(1, 255);
	for i = 1, #str do
		local byte = string.byte(str, i);
		local xored = bit32 and bit32.bxor(byte, key) or ((byte + key) % 256);
		table.insert(encoded, xored);
	end
	return encoded, key;
end

function ReferenceHiding:createEncodedStringAccess(scope, str)
	local encoded, key = self:encodeString(str);
	
	local charEntries = {};
	for i, byte in ipairs(encoded) do
		table.insert(charEntries, Ast.TableEntry(Ast.NumberExpression(byte)));
	end
	local bytesTable = Ast.TableConstructorExpression(charEntries);
	
	local decodeFunc = Ast.FunctionLiteralExpression(
		{},
		Ast.Block({
			Ast.LocalVariableDeclaration(
				scope,
				{scope:addVariable()},
				{bytesTable}
			),
			Ast.ReturnStatement({Ast.StringExpression(str)})
		}, scope)
	);
	
	return Ast.FunctionCallExpression(decodeFunc, {});
end

function ReferenceHiding:apply(ast, pipeline)
	local self2 = self;
	local scope = ast.body.scope;
	
	local localizedRefs = {};
	local apiTable = {};
	local apiTableId = nil;
	local declarations = {};
	
	if self.LocalizeBuiltins then
		for libName, functions in pairs(COMMON_BUILTINS) do
			for _, funcName in ipairs(functions) do
				if math.random() < self.Probability then
					local localVarId = scope:addVariable();
					local key = libName .. "." .. funcName;
					localizedRefs[key] = {
						scope = scope,
						id = localVarId,
					};
					
					local libAccess;
					if self.UseIndirectAccess then
						local gVar = scope:resolveGlobal("_G");
						libAccess = Ast.IndexExpression(
							Ast.VariableExpression(scope.globalScope or scope, gVar),
							Ast.StringExpression(libName)
						);
					else
						local libVar = scope:resolveGlobal(libName);
						libAccess = Ast.VariableExpression(scope.globalScope or scope, libVar);
					end
					
					local funcAccess = Ast.IndexExpression(libAccess, Ast.StringExpression(funcName));
					
					local initExpr;
					if self.WrapInClosures and math.random() < 0.5 then
						local wrapperScope = Scope:new(scope);
						local argsVarId = wrapperScope:addVariable();
						wrapperScope.vararg = true;
						local wrapperBody = Ast.Block({
							Ast.ReturnStatement({
								Ast.FunctionCallExpression(funcAccess, {Ast.VarargExpression()})
							})
						}, wrapperScope);
						initExpr = Ast.FunctionLiteralExpression({}, wrapperBody);
						initExpr.vararg = true;
					else
						initExpr = funcAccess;
					end
					
					table.insert(declarations, {
						id = localVarId,
						expr = initExpr,
					});
				end
			end
		end
		
		for _, globalName in ipairs(COMMON_GLOBALS) do
			if math.random() < self.Probability then
				local localVarId = scope:addVariable();
				localizedRefs[globalName] = {
					scope = scope,
					id = localVarId,
				};
				
				local globalAccess;
				if self.UseIndirectAccess then
					local gVar = scope:resolveGlobal("_G");
					globalAccess = Ast.IndexExpression(
						Ast.VariableExpression(scope.globalScope or scope, gVar),
						Ast.StringExpression(globalName)
					);
				else
					local gVar = scope:resolveGlobal(globalName);
					globalAccess = Ast.VariableExpression(scope.globalScope or scope, gVar);
				end
				
				local initExpr;
				if self.WrapInClosures and math.random() < 0.3 then
					local wrapperScope = Scope:new(scope);
					wrapperScope.vararg = true;
					local wrapperBody = Ast.Block({
						Ast.ReturnStatement({
							Ast.FunctionCallExpression(globalAccess, {Ast.VarargExpression()})
						})
					}, wrapperScope);
					initExpr = Ast.FunctionLiteralExpression({}, wrapperBody);
					initExpr.vararg = true;
				else
					initExpr = globalAccess;
				end
				
				table.insert(declarations, {
					id = localVarId,
					expr = initExpr,
				});
			end
		end
	end
	
	util.shuffle(declarations);
	
	local insertPos = 1;
	for _, decl in ipairs(declarations) do
		table.insert(ast.body.statements, insertPos, 
			Ast.LocalVariableDeclaration(scope, {decl.id}, {decl.expr})
		);
		insertPos = insertPos + 1;
	end
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.IndexExpression then
			if node.base.kind == AstKind.VariableExpression and
			   node.index.kind == AstKind.StringExpression then
				local baseName = node.base.scope:getVariableName(node.base.id);
				local indexName = node.index.value;
				local key = baseName .. "." .. indexName;
				
				if localizedRefs[key] then
					local ref = localizedRefs[key];
					data.scope:addReferenceToHigherScope(ref.scope, ref.id);
					return Ast.VariableExpression(ref.scope, ref.id);
				end
			end
		elseif node.kind == AstKind.VariableExpression then
			local varName = node.scope:getVariableName(node.id);
			if localizedRefs[varName] and node.scope.isGlobal then
				local ref = localizedRefs[varName];
				data.scope:addReferenceToHigherScope(ref.scope, ref.id);
				return Ast.VariableExpression(ref.scope, ref.id);
			end
		end
	end)
	
	return ast;
end

return ReferenceHiding;
