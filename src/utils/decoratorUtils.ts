import * as ts from 'typescript';
import { getInitializerValue } from '../metadataGeneration/initializer-value';
import { Expression, LeftHandSideExpression } from 'typescript';

export function getDecorators(
  node: ts.Node,
  isMatching: (identifier: ts.Identifier) => boolean
): ts.Identifier[] {
  // Ensure the node type supports decorators
  if (!ts.canHaveDecorators(node)) {
    return [];
  }

  const decorators = ts.getDecorators(node) ?? [];

  return decorators
    .map((decorator: ts.Decorator) => {
      let expr:LeftHandSideExpression | Expression = decorator.expression;

      // Unwrap nested expressions (e.g., @Decorator(), @(() => Decorator)(), etc.)
      while (ts.isCallExpression(expr) || ts.isParenthesizedExpression(expr)) {
        expr = expr.expression;
      }

      // Only return identifiers (ignore things like complex expressions)
      return ts.isIdentifier(expr) ? expr : null;
    })
    .filter((id): id is ts.Identifier => !!id && isMatching(id));
}


export function getNodeFirstDecoratorName(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }

  return decorators[0].text;
}

export function getNodeFirstDecoratorValue(node: ts.Node, typeChecker: ts.TypeChecker, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }
  const values = getDecoratorValues(decorators[0], typeChecker);
  return values && values[0];
}

export function getDecoratorValues(decorator: ts.Identifier, typeChecker: ts.TypeChecker) {
  const expression = decorator.parent as ts.CallExpression;
  const expArguments = expression.arguments;
  if (!expArguments || !expArguments.length) {
    return;
  }
  return expArguments.map(a => getInitializerValue(a, typeChecker));
}

export function getSecurites(decorator: ts.Identifier, typeChecker: ts.TypeChecker) {
  const [first, second] = getDecoratorValues(decorator, typeChecker) ?? [];
  if (isObject(first)) {
    return first;
  }
  return { [first]: second || [] };
}

export function isDecorator(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return false;
  }
  return true;
}

function isObject(v: any) {
  return typeof v === 'object' && v !== null;
}
