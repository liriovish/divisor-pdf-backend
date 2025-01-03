/**
 * Arquivo do composer para montar a comunicação entre a rota, db e outros
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Genérica
 * @author    Equipe Webcartórios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-whatsapp/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-whatsapp
 * @CriadoEm  14/11/2024
 */

/**
 * Configurações globais
 */
const ApiRouter = require('../../presentation/routers')
const ApiUseCase = require('../../domain/usecases/api-usecase')
const ApiValidator = require('../../utils/validators/api-validator')
/**
 * Realiza o export das classes de geração dos erros
 */
module.exports = class ApiComposer {
    /**
     * Fun��o respons�vel por fazer o upload
     *
     * @returns
     */
    static upload() {
        /**
         * Chama a classe do respositório que é resposável pela comunicação com
         * o banco de dados.
         *
         * @param {ApiValidator} apiValidator
         * 
         */
        const apiValidator = new ApiValidator()
        
        /**
         * Chama a classe do caso de uso que é responsável pela consulta no
         * banco de dados
         *
         * @var {ApiUseCase} apiUseCase
         *
         */
        const apiUseCase = new ApiUseCase()

        /**
         * Chama a classe da rota para montar e responder ao usuário com os
         * dados consultados no banco de dados
         *
         * @return {object}
         */
        return new ApiRouter.Upload({
            apiUseCase,
            apiValidator,
        })
    }
    /**
     * Fun��o respons�vel por fazer a divis�o personalizada
     *
     * @returns
     */
    static divisaoPersonalizada() {
        /**
         * Chama a classe do respositório que é resposável pela comunicação com
         * o banco de dados.
         *
         * @param {ApiValidator} apiValidator
         * 
         */
        const apiValidator = new ApiValidator()
        
        /**
         * Chama a classe do caso de uso que é responsável pela consulta no
         * banco de dados
         *
         * @var {ApiUseCase} apiUseCase
         *
         */
        const apiUseCase = new ApiUseCase()

        /**
         * Chama a classe da rota para montar e responder ao usuário com os
         * dados consultados no banco de dados
         *
         * @return {object}
         */
        return new ApiRouter.DivisaoPersonalizada({
            apiUseCase,
            apiValidator,
        })
    }

    
    /**
     * Fun��o respons�vel por fazer a divis�o fixa
     *
     * @returns
     */
    static divisaoFixa() {
        /**
         * Chama a classe do respositório que é resposável pela comunicação com
         * o banco de dados.
         *
         * @param {ApiValidator} apiValidator
         * 
         */
        const apiValidator = new ApiValidator()
        
        /**
         * Chama a classe do caso de uso que é responsável pela consulta no
         * banco de dados
         *
         * @var {ApiUseCase} apiUseCase
         *
         */
        const apiUseCase = new ApiUseCase()

        /**
         * Chama a classe da rota para montar e responder ao usuário com os
         * dados consultados no banco de dados
         *
         * @return {object}
         */
        return new ApiRouter.DivisaoFixa({
            apiUseCase,
            apiValidator,
        })
    }
    
    /**
     * Fun��o respons�vel por fazer a divis�o fixa
     *
     * @returns
     */
    static baixarArquivo() {
        /**
         * Chama a classe do respositório que é resposável pela comunicação com
         * o banco de dados.
         *
         * @param {ApiValidator} apiValidator
         * 
         */
        const apiValidator = new ApiValidator()
        
        /**
         * Chama a classe do caso de uso que é responsável pela consulta no
         * banco de dados
         *
         * @var {ApiUseCase} apiUseCase
         *
         */
        const apiUseCase = new ApiUseCase()

        /**
         * Chama a classe da rota para montar e responder ao usuário com os
         * dados consultados no banco de dados
         *
         * @return {object}
         */
        return new ApiRouter.BaixarArquivo({
            apiUseCase,
            apiValidator,
        })
    }

    
}