export default {
    input: 'build/model.js',
    output: [
        {
            file: 'bundle/dist.js',
            format: 'cjs'
        },
        {
            file: 'bundle/module.js',
            format: 'es'
        }
    ],
    external: ['ramda']
};
