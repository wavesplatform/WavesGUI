import { TaskFunction } from 'gulp';
import { loadLocales } from '../ts-scripts/utils';

export function createLocalesTask(output: string): TaskFunction {
    return function localeTask() {
        return loadLocales(output);
    }
}
