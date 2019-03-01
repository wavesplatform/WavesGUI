export default function loggable(constructor: Function) {
    const constructorsClass = constructor.prototype;
    Object.getOwnPropertyNames(constructorsClass)
        .filter(name => typeof constructorsClass[name] === 'function')
        .forEach(propertyName => {
            const descriptor = Object.getOwnPropertyDescriptor(constructorsClass, propertyName);;
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                console.log("Method's name " + propertyName);
                const result = originalMethod.apply(this, args);
                console.log("The return value is: " + result);
                return result;
            };

            Object.defineProperty(constructorsClass, propertyName, descriptor);
        });
}