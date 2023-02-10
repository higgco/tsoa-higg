export function Route(name?: string): Function {
  return () => {
    return;
  };
}

/**
 * can be used to entirely hide an method from documentation
 */
export function Hidden(): Function {
  return () => {
    return;
  };
}

/**
 *  Specify extra models of the controller that will be added to the swagger
 */
export function ExtraModels<A, B = void, C = void, D = void, E = void, F = void, G = void, H = void, I = void>() {
  return (target: any) => {
    return;
  };
}
