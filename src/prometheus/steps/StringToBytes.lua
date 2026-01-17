-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- StringToBytes.lua
--
-- This Script provides an Obfuscation Step that converts strings to byte arrays
-- that are assembled at runtime

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local StringToBytes = Step:extend();
StringToBytes.Description = "This Step converts strings to byte arrays that are assembled at runtime.";
StringToBytes.Name = "String To Bytes";

StringToBytes.SettingsDescriptor = {
	Threshold = {
		name = "Threshold",
		description = "Probability of converting a string to bytes (0-1)",
		type = "number",
		default = 0.8,
		min = 0,
		max = 1,
	},
	MinLength = {
		name = "MinLength",
		description = "Minimum string length to consider for conversion",
		type = "number",
		default = 1,
		min = 1,
	},
	MaxLength = {
		name = "MaxLength",
		description = "Maximum string length to consider for conversion (0 = no limit)",
		type = "number",
		default = 100,
		min = 0,
	},
	ObfuscateBytes = {
		name = "ObfuscateBytes",
		description = "Apply XOR obfuscation to byte values",
		type = "boolean",
		default = true,
	},
}

function StringToBytes:init(settings)
end

function StringToBytes:stringToBytes(str)
	local bytes = {};
	for i = 1, #str do
		bytes[i] = string.byte(str, i);
	end
	return bytes;
end

function StringToBytes:generateByteArray(bytes, obfuscate)
	local entries = {};
	local xorKey = obfuscate and math.random(1, 255) or 0;
	
	for i, byte in ipairs(bytes) do
		local obfuscatedByte = obfuscate and ((byte + xorKey) % 256) or byte;
		table.insert(entries, Ast.TableEntry(Ast.NumberExpression(obfuscatedByte)));
	end
	
	return Ast.TableConstructorExpression(entries), xorKey;
end

function StringToBytes:createReassemblyCall(byteArrayExpr, xorKey, scope, charVarScope, charVarId, concatVarScope, concatVarId)
	if xorKey == 0 then
		local funcScope = Scope:new(scope);
		local resultVarId = funcScope:addVariable();
		local iVarId = funcScope:addVariable();
		local vVarId = funcScope:addVariable();
		local tblVarId = funcScope:addVariable();
		
		local forBody = Ast.Block({
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(funcScope, resultVarId)},
				{Ast.StrCatExpression(
					Ast.VariableExpression(funcScope, resultVarId),
					Ast.FunctionCallExpression(
						Ast.VariableExpression(charVarScope, charVarId),
						{Ast.VariableExpression(funcScope, vVarId)}
					)
				)}
			)
		}, Scope:new(funcScope));
		
		scope:addReferenceToHigherScope(charVarScope, charVarId);
		
		local funcBody = Ast.Block({
			Ast.LocalVariableDeclaration(funcScope, {resultVarId}, {Ast.StringExpression("")}),
			Ast.ForInStatement(
				funcScope,
				{iVarId, vVarId},
				{Ast.FunctionCallExpression(
					Ast.VariableExpression(funcScope:resolveGlobal("ipairs")),
					{Ast.VariableExpression(funcScope, tblVarId)}
				)},
				forBody
			),
			Ast.ReturnStatement({Ast.VariableExpression(funcScope, resultVarId)})
		}, funcScope);
		
		local funcLiteral = Ast.FunctionLiteralExpression(
			{Ast.VariableExpression(funcScope, tblVarId)},
			funcBody
		);
		
		return Ast.FunctionCallExpression(funcLiteral, {byteArrayExpr});
	else
		local funcScope = Scope:new(scope);
		local resultVarId = funcScope:addVariable();
		local iVarId = funcScope:addVariable();
		local vVarId = funcScope:addVariable();
		local tblVarId = funcScope:addVariable();
		
		local forBodyScope = Scope:new(funcScope);
		local forBody = Ast.Block({
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(funcScope, resultVarId)},
				{Ast.StrCatExpression(
					Ast.VariableExpression(funcScope, resultVarId),
					Ast.FunctionCallExpression(
						Ast.VariableExpression(charVarScope, charVarId),
						{Ast.ModExpression(
							Ast.SubExpression(
								Ast.VariableExpression(funcScope, vVarId),
								Ast.NumberExpression(xorKey)
							),
							Ast.NumberExpression(256)
						)}
					)
				)}
			)
		}, forBodyScope);
		
		scope:addReferenceToHigherScope(charVarScope, charVarId);
		
		local funcBody = Ast.Block({
			Ast.LocalVariableDeclaration(funcScope, {resultVarId}, {Ast.StringExpression("")}),
			Ast.ForInStatement(
				funcScope,
				{iVarId, vVarId},
				{Ast.FunctionCallExpression(
					Ast.VariableExpression(funcScope:resolveGlobal("ipairs")),
					{Ast.VariableExpression(funcScope, tblVarId)}
				)},
				forBody
			),
			Ast.ReturnStatement({Ast.VariableExpression(funcScope, resultVarId)})
		}, funcScope);
		
		local funcLiteral = Ast.FunctionLiteralExpression(
			{Ast.VariableExpression(funcScope, tblVarId)},
			funcBody
		);
		
		return Ast.FunctionCallExpression(funcLiteral, {byteArrayExpr});
	end
end

function StringToBytes:apply(ast, pipeline)
	local self2 = self;
	
	local charVarId = ast.body.scope:addVariable();
	local charVarScope = ast.body.scope;
	local concatVarId = ast.body.scope:addVariable();
	local concatVarScope = ast.body.scope;
	
	local globalScope = ast.globalScope;
	local stringScope, stringId = globalScope:resolve("string");
	local tableScope, tableId = globalScope:resolve("table");
	
	ast.body.scope:addReferenceToHigherScope(stringScope, stringId);
	ast.body.scope:addReferenceToHigherScope(tableScope, tableId);
	
	local charDecl = Ast.LocalVariableDeclaration(
		charVarScope,
		{charVarId},
		{Ast.IndexExpression(
			Ast.VariableExpression(stringScope, stringId),
			Ast.StringExpression("char")
		)}
	);
	
	local concatDecl = Ast.LocalVariableDeclaration(
		concatVarScope,
		{concatVarId},
		{Ast.IndexExpression(
			Ast.VariableExpression(tableScope, tableId),
			Ast.StringExpression("concat")
		)}
	);
	
	table.insert(ast.body.statements, 1, concatDecl);
	table.insert(ast.body.statements, 1, charDecl);
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.StringExpression then
			local str = node.value;
			local len = #str;
			
			if len < self2.MinLength then
				return;
			end
			
			if self2.MaxLength > 0 and len > self2.MaxLength then
				return;
			end
			
			if math.random() > self2.Threshold then
				return;
			end
			
			local bytes = self2:stringToBytes(str);
			local byteArrayExpr, xorKey = self2:generateByteArray(bytes, self2.ObfuscateBytes);
			
			return self2:createReassemblyCall(
				byteArrayExpr, 
				xorKey, 
				data.scope, 
				charVarScope, 
				charVarId,
				concatVarScope,
				concatVarId
			);
		end
	end)
	
	return ast;
end

return StringToBytes;
