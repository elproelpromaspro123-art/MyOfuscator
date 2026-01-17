-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- JunkCode.lua
--
-- This Script provides an Obfuscation Step that inserts dead code
-- and junk computations that don't affect execution

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local JunkCode = Step:extend();
JunkCode.Description = "This Step inserts dead code and junk computations that don't affect execution.";
JunkCode.Name = "Junk Code";

JunkCode.SettingsDescriptor = {
	Density = {
		name = "Density",
		description = "Probability of inserting junk code after a statement (0-1)",
		type = "number",
		default = 0.2,
		min = 0,
		max = 1,
	},
	MaxJunkOps = {
		name = "MaxJunkOps",
		description = "Maximum number of junk operations to insert at once",
		type = "number",
		default = 3,
		min = 1,
		max = 10,
	},
}

function JunkCode:init(settings)
end

function JunkCode:generateJunkVariable(scope)
	local varId = scope:addVariable();
	return varId;
end

function JunkCode:generateJunkExpression(depth)
	if depth > 3 then
		return Ast.NumberExpression(math.random(-1000, 1000));
	end
	
	local generators = {
		function()
			return Ast.NumberExpression(math.random(-10000, 10000));
		end,
		function()
			return Ast.StringExpression(self:randomString(math.random(3, 10)));
		end,
		function()
			return Ast.AddExpression(
				self:generateJunkExpression(depth + 1),
				self:generateJunkExpression(depth + 1)
			);
		end,
		function()
			return Ast.SubExpression(
				self:generateJunkExpression(depth + 1),
				self:generateJunkExpression(depth + 1)
			);
		end,
		function()
			return Ast.MulExpression(
				self:generateJunkExpression(depth + 1),
				Ast.NumberExpression(math.random(1, 10))
			);
		end,
		function()
			return Ast.ModExpression(
				Ast.NumberExpression(math.random(10, 1000)),
				Ast.NumberExpression(math.random(2, 50))
			);
		end,
		function()
			return Ast.StrCatExpression(
				Ast.StringExpression(self:randomString(math.random(2, 5))),
				Ast.StringExpression(self:randomString(math.random(2, 5)))
			);
		end,
		function()
			return Ast.LenExpression(
				Ast.StringExpression(self:randomString(math.random(5, 15)))
			);
		end,
	};
	
	return generators[math.random(#generators)]();
end

function JunkCode:randomString(length)
	local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	local result = "";
	for i = 1, length do
		local idx = math.random(1, #chars);
		result = result .. string.sub(chars, idx, idx);
	end
	return result;
end

function JunkCode:generateJunkDeclaration(scope)
	local varId = self:generateJunkVariable(scope);
	local expr = self:generateJunkExpression(0);
	return Ast.LocalVariableDeclaration(scope, {varId}, {expr});
end

function JunkCode:generateJunkAssignment(scope, existingVarId)
	local expr = self:generateJunkExpression(0);
	return Ast.AssignmentStatement(
		{Ast.AssignmentVariable(scope, existingVarId)},
		{expr}
	);
end

function JunkCode:generateDeadBranch(scope)
	local falseCondition;
	local choice = math.random(1, 4);
	
	if choice == 1 then
		local a = math.random(1, 100);
		falseCondition = Ast.LessThanExpression(
			Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(a)),
			Ast.NumberExpression(0)
		);
	elseif choice == 2 then
		local x = math.random(1, 50);
		falseCondition = Ast.EqualsExpression(
			Ast.NumberExpression(x),
			Ast.NumberExpression(x + 1)
		);
	elseif choice == 3 then
		falseCondition = Ast.AndExpression(
			Ast.BooleanExpression(true),
			Ast.BooleanExpression(false)
		);
	else
		local n = math.random(1, 100);
		falseCondition = Ast.GreaterThanExpression(
			Ast.NumberExpression(0),
			Ast.NumberExpression(n * n + 1)
		);
	end
	
	local bodyScope = Scope:new(scope);
	local junkStatements = {};
	local numJunk = math.random(1, 3);
	
	for i = 1, numJunk do
		table.insert(junkStatements, self:generateJunkDeclaration(bodyScope));
	end
	
	local body = Ast.Block(junkStatements, bodyScope);
	return Ast.IfStatement(falseCondition, body, {}, nil);
end

function JunkCode:generateJunkLoop(scope)
	local bodyScope = Scope:new(scope);
	local junkStatements = {};
	
	table.insert(junkStatements, self:generateJunkDeclaration(bodyScope));
	table.insert(junkStatements, Ast.BreakStatement());
	
	local body = Ast.Block(junkStatements, bodyScope);
	
	local choice = math.random(1, 2);
	if choice == 1 then
		return Ast.WhileStatement(Ast.BooleanExpression(false), body);
	else
		local neverExecuteCondition = Ast.LessThanExpression(
			Ast.NumberExpression(1),
			Ast.NumberExpression(0)
		);
		return Ast.WhileStatement(neverExecuteCondition, body);
	end
end

function JunkCode:generateJunkStatements(scope, count)
	local statements = {};
	local junkVars = {};
	
	for i = 1, count do
		local choice = math.random(1, 5);
		
		if choice == 1 then
			local decl = self:generateJunkDeclaration(scope);
			table.insert(statements, decl);
			table.insert(junkVars, decl.ids[1]);
		elseif choice == 2 and #junkVars > 0 then
			local varId = junkVars[math.random(#junkVars)];
			table.insert(statements, self:generateJunkAssignment(scope, varId));
		elseif choice == 3 then
			table.insert(statements, self:generateDeadBranch(scope));
		elseif choice == 4 then
			table.insert(statements, self:generateJunkLoop(scope));
		else
			local decl = self:generateJunkDeclaration(scope);
			table.insert(statements, decl);
			table.insert(junkVars, decl.ids[1]);
		end
	end
	
	return statements;
end

function JunkCode:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.Block then
			local newStatements = {};
			
			for i, stmt in ipairs(node.statements) do
				table.insert(newStatements, stmt);
				
				if stmt.kind ~= AstKind.ReturnStatement and
				   stmt.kind ~= AstKind.BreakStatement and
				   stmt.kind ~= AstKind.ContinueStatement and
				   math.random() < self2.Density then
					
					local numJunk = math.random(1, self2.MaxJunkOps);
					local junkStatements = self2:generateJunkStatements(node.scope, numJunk);
					
					for _, junk in ipairs(junkStatements) do
						table.insert(newStatements, junk);
					end
				end
			end
			
			node.statements = newStatements;
		end
	end)
	
	return ast;
end

return JunkCode;
