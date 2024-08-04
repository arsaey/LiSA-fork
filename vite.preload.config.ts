import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, external, pluginHotRestart } from './vite.base.config.js';

// https://vitejs.dev/config
export default defineConfig((env) => {
    const forgeEnv = env as ConfigEnv<'build'>;
    const { forgeConfigSelf, command } = forgeEnv;
    const config: UserConfig = {
        publicDir: false,
        build: {
            rollupOptions: {
                external,
                // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                input: forgeConfigSelf.entry!,
                output: {
                    format: 'cjs',
                    // It should not be split chunks.
                    inlineDynamicImports: true,
                    entryFileNames: '[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: '[name].[ext]',
                },
            },
        },
        plugins: [pluginHotRestart('reload')],
        esbuild:
            command === 'build'
                ? {
                      drop: ['console', 'debugger'],
                  }
                : {},
    };

    return mergeConfig(getBuildConfig(forgeEnv), config);
});
