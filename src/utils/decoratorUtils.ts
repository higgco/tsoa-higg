import * as ts from 'typescript';
import { getInitializerValue } from '../metadataGeneration/initializer-value';

export function getDecorators(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean): ts.Identifier[] {
  const decorators: ts.NodeArray<ts.Decorator> | undefined = node.decorators;
  const decoratorsAny = decorators as any;
  if (!decoratorsAny || decoratorsAny.length === 0) {
    return [];
  }

  return decoratorsAny
    .map((e: ts.Decorator) => {
      let expr = e.expression;
      while (ts.isDecorator(expr) || ts.isCallExpression(expr)) {
        // Unwrap nested decorators or call expressions
        expr = (expr as any).expression;
      }
      if (ts.isIdentifier(expr)) {
        return expr;
      }
      return undefined;
    })
    .filter((id: ts.Identifier | undefined): id is ts.Identifier => !!id)
    .filter(isMatching);
}

export function getNodeFirstDecoratorName(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean): string | undefined {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || decorators.length === 0) {
    return;
  }

  return decorators[0].text;
}

export function getNodeFirstDecoratorValue(node: ts.Node, typeChecker: ts.TypeChecker, isMatching: (identifier: ts.Identifier) => boolean): any {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || decorators.length === 0) {
    return;
  }
  const values = getDecoratorValues(decorators[0], typeChecker);
  return values && values[0];
}

export function getDecoratorValues(decorator: ts.Identifier, typeChecker: ts.TypeChecker): any[] {
  const expression = decorator.parent as ts.CallExpression;
  const expArguments = expression.arguments;
  if (!expArguments || expArguments.length === 0) {
    return [];
  }
  return expArguments.map(a => getInitializerValue(a, typeChecker));
}

export function getSecurites(decorator: ts.Identifier, typeChecker: ts.TypeChecker) {
  const [first, second] = getDecoratorValues(decorator, typeChecker);
  if (isObject(first)) {
    return first;
  }
  return { [first]: second || [] };
}

export function isDecorator(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean): boolean {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || decorators.length === 0) {
    return false;
  }
  return true;
}

function isObject(v: any) {
  return typeof v === 'object' && v !== null;
}
