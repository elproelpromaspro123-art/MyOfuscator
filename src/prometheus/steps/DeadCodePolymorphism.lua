-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- DeadCodePolymorphism.lua
--
-- This Script provides polymorphic dead code insertion:
-- - Generate different variants of the same dead code
-- - Dead code that looks real with coherent logic
-- - Fake loops with opaque conditions
-- - Ghost functions that are never called but look useful
-- - Tables with fake data that appear to be used in dead code

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local DeadCodePolymorphism = Step:extend();
DeadCodePolymorphism.Description = "This Step inserts polymorphic dead code that looks real and varies in structure.";
DeadCodePolymorphism.Name = "Dead Code Polymorphism";

DeadCodePolymorphism.SettingsDescriptor = {
	Density = {
		name = "Density",
		description = "Probability of inserting dead code after a statement (0-1)",
		type = "number",
		default = 0.15,
		min = 0,
		max = 1,
	},
	GhostFunctions = {
		name = "GhostFunctions",
		description = "Number of ghost functions to insert per function body",
		type = "number",
		default = 2,
		min = 0,
		max = 5,
	},
	FakeDataTables = {
		name = "FakeDataTables",
		description = "Number of fake data tables to insert",
		type = "number",
		default = 1,
		min = 0,
		max = 5,
	},
	VariantCount = {
		name = "VariantCount",
		description = "Number of polymorphic variants for each dead code type",
		type = "number",
		default = 3,
		min = 1,
		max = 10,
	},
}

function DeadCodePolymorphism:init(settings)
end

function DeadCodePolymorphism:randomString(length)
	local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	local result = "";
	for i = 1, length do
		local idx = math.random(1, #chars);
		result = result .. string.sub(chars, idx, idx);
	end
	return result;
end

function DeadCodePolymorphism:generateOpaquelyFalseCondition()
	local generators = {
		function()
			local a = math.random(1, 100);
			return Ast.LessThanExpression(
				Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(a)),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local x = math.random(1, 50);
			return Ast.EqualsExpression(
				Ast.NumberExpression(x),
				Ast.NumberExpression(x + 1)
			);
		end,
		function()
			return Ast.AndExpression(
				Ast.BooleanExpression(true),
				Ast.BooleanExpression(false)
			);
		end,
		function()
			local n = math.random(1, 100);
			return Ast.GreaterThanExpression(
				Ast.NumberExpression(0),
				Ast.MulExpression(Ast.NumberExpression(n), Ast.NumberExpression(n))
			);
		end,
		function()
			local str = self:randomString(5);
			return Ast.EqualsExpression(
				Ast.LenExpression(Ast.StringExpression(str)),
				Ast.NumberExpression(#str + math.random(1, 10))
			);
		end,
		function()
			local a = math.random(1, 50);
			local b = math.random(60, 100);
			return Ast.GreaterThanExpression(
				Ast.NumberExpression(a),
				Ast.NumberExpression(b)
			);
		end,
	};
	
	return generators[math.random(#generators)]();
end

function DeadCodePolymorphism:generateCoherentCalculation(scope, depth)
	if depth > 2 then
		return Ast.NumberExpression(math.random(-100, 100));
	end
	
	local generators = {
		function()
			local a = math.random(1, 50);
			local b = math.random(1, 50);
			return Ast.AddExpression(Ast.NumberExpression(a), Ast.NumberExpression(b));
		end,
		function()
			local a = math.random(10, 100);
			local b = math.random(1, 10);
			return Ast.SubExpression(Ast.NumberExpression(a), Ast.NumberExpression(b));
		end,
		function()
			local a = math.random(2, 20);
			local b = math.random(2, 10);
			return Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(b));
		end,
		function()
			local a = math.random(10, 100);
			local b = math.random(2, 10);
			return Ast.ModExpression(Ast.NumberExpression(a), Ast.NumberExpression(b));
		end,
		function()
			local inner = self:generateCoherentCalculation(scope, depth + 1);
			return Ast.AddExpression(inner, Ast.NumberExpression(math.random(1, 10)));
		end,
		function()
			local floorAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("math")),
				Ast.StringExpression("floor")
			);
			return Ast.FunctionCallExpression(floorAccess, {
				Ast.DivExpression(
					Ast.NumberExpression(math.random(10, 100)),
					Ast.NumberExpression(math.random(2, 10))
				)
			});
		end,
	};
	
	return generators[math.random(#generators)]();
end

function DeadCodePolymorphism:generateRealisticDeadBlock(scope, variant)
	local statements = {};
	
	if variant == 1 then
		local counterVarId = scope:addVariable();
		local sumVarId = scope:addVariable();
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {counterVarId}, {Ast.NumberExpression(0)}));
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {sumVarId}, {Ast.NumberExpression(0)}));
		
		local loopScope = Scope:new(scope);
		local iVarId = loopScope:addVariable();
		local loopBody = Ast.Block({
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(scope, sumVarId)},
				{Ast.AddExpression(
					Ast.VariableExpression(scope, sumVarId),
					Ast.VariableExpression(loopScope, iVarId)
				)}
			),
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(scope, counterVarId)},
				{Ast.AddExpression(
					Ast.VariableExpression(scope, counterVarId),
					Ast.NumberExpression(1)
				)}
			),
		}, loopScope);
		
		table.insert(statements, Ast.ForStatement(
			loopScope,
			iVarId,
			Ast.NumberExpression(1),
			Ast.NumberExpression(math.random(5, 20)),
			nil,
			loopBody
		));
		
	elseif variant == 2 then
		local dataVarId = scope:addVariable();
		local entries = {};
		for i = 1, math.random(3, 7) do
			table.insert(entries, Ast.KeyedTableEntry(
				Ast.StringExpression(self:randomString(5)),
				Ast.NumberExpression(math.random(1, 1000))
			));
		end
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {dataVarId}, {Ast.TableConstructorExpression(entries)}));
		
		local resultVarId = scope:addVariable();
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {resultVarId}, {Ast.NumberExpression(0)}));
		
		local loopScope = Scope:new(scope);
		local kVarId = loopScope:addVariable();
		local vVarId = loopScope:addVariable();
		
		local loopBody = Ast.Block({
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(scope, resultVarId)},
				{Ast.AddExpression(
					Ast.VariableExpression(scope, resultVarId),
					Ast.VariableExpression(loopScope, vVarId)
				)}
			)
		}, loopScope);
		
		local pairsAccess = Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("pairs"));
		local pairsCall = Ast.FunctionCallExpression(pairsAccess, {Ast.VariableExpression(scope, dataVarId)});
		
		table.insert(statements, Ast.ForInStatement(
			loopScope,
			{kVarId, vVarId},
			{pairsCall},
			loopBody
		));
		
	elseif variant == 3 then
		local configVarId = scope:addVariable();
		local entries = {
			Ast.KeyedTableEntry(Ast.StringExpression("enabled"), Ast.BooleanExpression(true)),
			Ast.KeyedTableEntry(Ast.StringExpression("threshold"), Ast.NumberExpression(math.random(50, 200))),
			Ast.KeyedTableEntry(Ast.StringExpression("mode"), Ast.StringExpression(self:randomString(6))),
			Ast.KeyedTableEntry(Ast.StringExpression("retries"), Ast.NumberExpression(math.random(1, 5))),
		};
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {configVarId}, {Ast.TableConstructorExpression(entries)}));
		
		local valueVarId = scope:addVariable();
		table.insert(statements, Ast.LocalVariableDeclaration(
			scope,
			{valueVarId},
			{Ast.IndexExpression(Ast.VariableExpression(scope, configVarId), Ast.StringExpression("threshold"))}
		));
		
		local ifScope = Scope:new(scope);
		local ifBody = Ast.Block({
			Ast.AssignmentStatement(
				{Ast.AssignmentVariable(scope, valueVarId)},
				{Ast.MulExpression(Ast.VariableExpression(scope, valueVarId), Ast.NumberExpression(2))}
			)
		}, ifScope);
		
		table.insert(statements, Ast.IfStatement(
			Ast.IndexExpression(Ast.VariableExpression(scope, configVarId), Ast.StringExpression("enabled")),
			ifBody,
			{},
			nil
		));
		
	else
		local bufferVarId = scope:addVariable();
		table.insert(statements, Ast.LocalVariableDeclaration(scope, {bufferVarId}, {Ast.TableConstructorExpression({})}));
		
		local loopScope = Scope:new(scope);
		local iVarId = loopScope:addVariable();
		
		local insertAccess = Ast.IndexExpression(
			Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("table")),
			Ast.StringExpression("insert")
		);
		
		local loopBody = Ast.Block({
			Ast.FunctionCallStatement(insertAccess, {
				Ast.VariableExpression(scope, bufferVarId),
				Ast.MulExpression(Ast.VariableExpression(loopScope, iVarId), Ast.NumberExpression(2))
			})
		}, loopScope);
		
		table.insert(statements, Ast.ForStatement(
			loopScope,
			iVarId,
			Ast.NumberExpression(1),
			Ast.NumberExpression(math.random(3, 10)),
			nil,
			loopBody
		));
	end
	
	return statements;
end

function DeadCodePolymorphism:generateGhostFunction(scope)
	local funcVarId = scope:addVariable();
	local funcScope = Scope:new(scope);
	
	local numParams = math.random(1, 3);
	local paramIds = {};
	for i = 1, numParams do
		table.insert(paramIds, funcScope:addVariable());
	end
	
	local bodyStatements = {};
	
	local localVarId = funcScope:addVariable();
	table.insert(bodyStatements, Ast.LocalVariableDeclaration(
		funcScope,
		{localVarId},
		{self:generateCoherentCalculation(funcScope, 0)}
	));
	
	if #paramIds > 0 then
		table.insert(bodyStatements, Ast.AssignmentStatement(
			{Ast.AssignmentVariable(funcScope, localVarId)},
			{Ast.AddExpression(
				Ast.VariableExpression(funcScope, localVarId),
				Ast.VariableExpression(funcScope, paramIds[1])
			)}
		));
	end
	
	local condScope = Scope:new(funcScope);
	local condBody = Ast.Block({
		Ast.ReturnStatement({Ast.VariableExpression(funcScope, localVarId)})
	}, condScope);
	
	table.insert(bodyStatements, Ast.IfStatement(
		Ast.GreaterThanExpression(Ast.VariableExpression(funcScope, localVarId), Ast.NumberExpression(0)),
		condBody,
		{},
		nil
	));
	
	table.insert(bodyStatements, Ast.ReturnStatement({Ast.NumberExpression(0)}));
	
	local funcBody = Ast.Block(bodyStatements, funcScope);
	local funcLiteral = Ast.FunctionLiteralExpression(paramIds, funcBody);
	
	return Ast.LocalVariableDeclaration(scope, {funcVarId}, {funcLiteral});
end

function DeadCodePolymorphism:generateFakeDataTable(scope)
	local tableVarId = scope:addVariable();
	local entries = {};
	
	local numEntries = math.random(5, 15);
	for i = 1, numEntries do
		local keyType = math.random(1, 2);
		local valueType = math.random(1, 4);
		
		local key;
		if keyType == 1 then
			key = Ast.StringExpression(self:randomString(math.random(4, 10)));
		else
			key = Ast.NumberExpression(i);
		end
		
		local value;
		if valueType == 1 then
			value = Ast.NumberExpression(math.random(-1000, 1000));
		elseif valueType == 2 then
			value = Ast.StringExpression(self:randomString(math.random(5, 20)));
		elseif valueType == 3 then
			value = Ast.BooleanExpression(math.random() < 0.5);
		else
			local innerEntries = {};
			for j = 1, math.random(2, 4) do
				table.insert(innerEntries, Ast.TableEntry(Ast.NumberExpression(math.random(1, 100))));
			end
			value = Ast.TableConstructorExpression(innerEntries);
		end
		
		table.insert(entries, Ast.KeyedTableEntry(key, value));
	end
	
	return Ast.LocalVariableDeclaration(scope, {tableVarId}, {Ast.TableConstructorExpression(entries)});
end

function DeadCodePolymorphism:generateDeadCodeWithOpaquePredicate(scope)
	local condition = self:generateOpaquelyFalseCondition();
	local bodyScope = Scope:new(scope);
	
	local variant = math.random(1, self.VariantCount);
	local bodyStatements = self:generateRealisticDeadBlock(bodyScope, variant);
	
	local body = Ast.Block(bodyStatements, bodyScope);
	return Ast.IfStatement(condition, body, {}, nil);
end

function DeadCodePolymorphism:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.FunctionLiteralExpression or
		   node.kind == AstKind.FunctionDeclaration or
		   node.kind == AstKind.LocalFunctionDeclaration then
			
			local body = node.body;
			if body and body.statements then
				local insertPos = 1;
				
				for i = 1, self2.GhostFunctions do
					local ghostFunc = self2:generateGhostFunction(body.scope);
					table.insert(body.statements, insertPos, ghostFunc);
					insertPos = insertPos + 1;
				end
				
				for i = 1, self2.FakeDataTables do
					local fakeTable = self2:generateFakeDataTable(body.scope);
					table.insert(body.statements, insertPos, fakeTable);
					insertPos = insertPos + 1;
				end
			end
		end
		
		if node.kind == AstKind.Block then
			local newStatements = {};
			
			for i, stmt in ipairs(node.statements) do
				table.insert(newStatements, stmt);
				
				if stmt.kind ~= AstKind.ReturnStatement and
				   stmt.kind ~= AstKind.BreakStatement and
				   stmt.kind ~= AstKind.ContinueStatement and
				   stmt.kind ~= AstKind.LocalFunctionDeclaration and
				   math.random() < self2.Density then
					
					local deadCode = self2:generateDeadCodeWithOpaquePredicate(node.scope);
					table.insert(newStatements, deadCode);
				end
			end
			
			node.statements = newStatements;
		end
	end)
	
	return ast;
end

return DeadCodePolymorphism;
