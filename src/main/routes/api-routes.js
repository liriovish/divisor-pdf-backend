/**
 * Função para geração das rotas
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Divisor de PDF
 * @author    Equipe Webcartórios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-whatsapp/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-whatsapp
 * @CriadoEm  14/11/2024
 */

/**
 * Configurações globais
 */
const { adapt } = require('../adapters/express-router-adapter')
const ApiRouteComposer = require('../composers/api-composer')
const multer = require('multer');

/**
 *  ConfiguraÇÃo do multer com armazenamento na memÓria
 *  
 */
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
/**
 * Realiza o export das rotas
 */
module.exports = router => {
    /**
     * Rota POST para upload de PDF
     * @UsaFuncao adapt
     * @UsaFuncao ApiRouteComposer.upload
     * @return {object}
     */
    router.post('/v1/pdf/upload', upload.single('arquivo'), (req, res, next) => {
        req.body = { oArquivo: req.file };
        return adapt(ApiRouteComposer.upload())(req, res, next);
    });


    /**
     * Rota POST para divisão personalizada do pdf
     * @UsaFuncao adapt
     * @UsaFuncao ApiRouteComposer.divisaoPersonalizada
     * @return {object}
     */
    router.post('/v1/pdf/divisor/personalizado', adapt(ApiRouteComposer.divisaoPersonalizada()))
    
    
    /**
     * Rota POST para divisão fixa do pdf
     * @UsaFuncao adapt
     * @UsaFuncao ApiRouteComposer.divisaoPersonalizada
     * @return {object}
     */
    router.post('/v1/pdf/divisor/fixo', adapt(ApiRouteComposer.divisaoFixa()))
    
    /**
     * Rota GET download do pdf
     * @UsaFuncao adapt
     * @UsaFuncao ApiRouteComposer.divisaoPersonalizada
     * @return {object}
     */
    router.get('/v1/pdf/download/:originalname', adapt(ApiRouteComposer.baixarArquivo()))

};
