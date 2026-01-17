-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- OpaquePredicates.lua
--
-- This Script provides an Obfuscation Step that inserts opaque predicates
-- (conditions that are provably constant but look complex)

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local OpaquePredicates = Step:extend();
OpaquePredicates.Description = "This Step inserts opaque predicates (conditions that are provably constant but appear complex).";
OpaquePredicates.Name = "Opaque Predicates";

OpaquePredicates.SettingsDescriptor = {
	Density = {
		name = "Density",
		description = "Probability of wrapping a statement with an opaque predicate (0-1)",
		type = "number",
		default = 0.3,
		min = 0,
		max = 1,
	},
	Complexity = {
		name = "Complexity",
		description = "Complexity level of generated predicates (1-5)",
		type = "number",
		default = 2,
		min = 1,
		max = 5,
	},
}

function OpaquePredicates:init(settings)
end

function OpaquePredicates:generateOpaqueTrue(scope, complexity)
	local generators = {
		function()
			local a = math.random(1, 100);
			local b = math.random(1, 100);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(a)),
					Ast.NumberExpression(4)
				),
				Ast.NumberExpression((a * a) % 4)
			);
		end,
		function()
			local n = math.random(2, 50);
			return Ast.GreaterThanOrEqualsExpression(
				Ast.MulExpression(Ast.NumberExpression(n), Ast.NumberExpression(n)),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local x = math.random(1, 100);
			return Ast.EqualsExpression(
				Ast.SubExpression(
					Ast.AddExpression(Ast.NumberExpression(x), Ast.NumberExpression(x)),
					Ast.MulExpression(Ast.NumberExpression(2), Ast.NumberExpression(x))
				),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local a = math.random(1, 50);
			local b = math.random(1, 50);
			return Ast.EqualsExpression(
				Ast.AddExpression(
					Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(b)),
					Ast.MulExpression(Ast.NumberExpression(b), Ast.NumberExpression(a))
				),
				Ast.NumberExpression(2 * a * b)
			);
		end,
		function()
			local n = math.random(1, 20);
			return Ast.LessThanOrEqualsExpression(
				Ast.NumberExpression(0),
				Ast.PowExpression(Ast.NumberExpression(n), Ast.NumberExpression(2))
			);
		end,
		function()
			local x = math.random(1, 100);
			local y = math.random(1, 100);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.AddExpression(
						Ast.MulExpression(Ast.NumberExpression(x), Ast.NumberExpression(y)),
						Ast.MulExpression(Ast.NumberExpression(y), Ast.NumberExpression(x))
					),
					Ast.NumberExpression(2)
				),
				Ast.NumberExpression((2 * x * y) % 2)
			);
		end,
		function()
			return Ast.OrExpression(
				Ast.GreaterThanExpression(Ast.NumberExpression(1), Ast.NumberExpression(0)),
				Ast.BooleanExpression(false)
			);
		end,
		function()
			local a = math.random(1, 100);
			return Ast.NotExpression(
				Ast.LessThanExpression(Ast.NumberExpression(a * a), Ast.NumberExpression(0))
			);
		end,
	};
	
	if complexity >= 3 then
		local base = generators[math.random(#generators)]();
		local extra = generators[math.random(#generators)]();
		return Ast.AndExpression(base, extra);
	elseif complexity >= 4 then
		local base = generators[math.random(#generators)]();
		local extra1 = generators[math.random(#generators)]();
		local extra2 = generators[math.random(#generators)]();
		return Ast.AndExpression(Ast.AndExpression(base, extra1), extra2);
	else
		return generators[math.random(#generators)]();
	end
end

function OpaquePredicates:generateOpaqueFalse(scope, complexity)
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
				Ast.AddExpression(Ast.NumberExpression(x), Ast.NumberExpression(1)),
				Ast.NumberExpression(x)
			);
		end,
		function()
			return Ast.AndExpression(
				Ast.BooleanExpression(true),
				Ast.BooleanExpression(false)
			);
		end,
		function()
			local n = math.random(2, 100);
			return Ast.EqualsExpression(
				Ast.MulExpression(Ast.NumberExpression(n), Ast.NumberExpression(0)),
				Ast.NumberExpression(1)
			);
		end,
		function()
			local a = math.random(1, 50);
			local b = math.random(51, 100);
			return Ast.GreaterThanExpression(
				Ast.NumberExpression(a),
				Ast.NumberExpression(b)
			);
		end,
		function()
			return Ast.NotExpression(
				Ast.GreaterThanOrEqualsExpression(Ast.NumberExpression(1), Ast.NumberExpression(0))
			);
		end,
	};
	
	if complexity >= 3 then
		local base = generators[math.random(#generators)]();
		local extra = generators[math.random(#generators)]();
		return Ast.OrExpression(base, extra);
	else
		return generators[math.random(#generators)]();
	end
end

function OpaquePredicates:wrapWithOpaqueTrue(statement, scope, complexity)
	local condition = self:generateOpaqueTrue(scope, complexity);
	local bodyScope = Scope:new(scope);
	local body = Ast.Block({statement}, bodyScope);
	return Ast.IfStatement(condition, body, {}, nil);
end

function OpaquePredicates:wrapWithOpaqueFalseElse(statement, scope, complexity)
	local condition = self:generateOpaqueFalse(scope, complexity);
	local dummyScope = Scope:new(scope);
	local dummyBody = Ast.Block({Ast.NopStatement()}, dummyScope);
	local elseScope = Scope:new(scope);
	local elseBody = Ast.Block({statement}, elseScope);
	return Ast.IfStatement(condition, dummyBody, {}, elseBody);
end

function OpaquePredicates:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.Block then
			local newStatements = {};
			for i, stmt in ipairs(node.statements) do
				if stmt.kind ~= AstKind.LocalVariableDeclaration and
				   stmt.kind ~= AstKind.LocalFunctionDeclaration and
				   stmt.kind ~= AstKind.FunctionDeclaration and
				   stmt.kind ~= AstKind.ReturnStatement and
				   stmt.kind ~= AstKind.BreakStatement and
				   stmt.kind ~= AstKind.ContinueStatement and
				   stmt.kind ~= AstKind.IfStatement and
				   stmt.kind ~= AstKind.WhileStatement and
				   stmt.kind ~= AstKind.ForStatement and
				   stmt.kind ~= AstKind.ForInStatement and
				   stmt.kind ~= AstKind.RepeatStatement and
				   stmt.kind ~= AstKind.DoStatement and
				   math.random() < self2.Density then
					
					if math.random() < 0.7 then
						table.insert(newStatements, self2:wrapWithOpaqueTrue(stmt, node.scope, self2.Complexity));
					else
						table.insert(newStatements, self2:wrapWithOpaqueFalseElse(stmt, node.scope, self2.Complexity));
					end
				else
					table.insert(newStatements, stmt);
				end
			end
			node.statements = newStatements;
		end
	end)
	
	return ast;
end

return OpaquePredicates;
