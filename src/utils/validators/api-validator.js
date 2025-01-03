/**
 * Classe para validaÃ§Ã£o do cliente
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Genï¿½rica
 * @author    Equipe WebcartÃ³rios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-whatsapp/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-whatsapp
 * @CriadoEm  14/11/2024
 */

/**
 * ConfiguraÃ§Ãµes globais
 */
const { CustomError, NotFoundError, InvalidRequestError, InvalidParamError } = require('../errors')
const HttpResponse = require('../../presentation/helpers/http-response')

/**
 * Classe ApiValidator
 * @package  src\presentation\routers
 */
module.exports = class ApiValidator {
    /*
     * @param  {object} oDados
     *
     * @return {object|null}  Retorna a resposta de erro ou null no caso de OK
     */
    async upload(oDados) {
        /**
         * Valida se existe o numero do destinatario
         */
        if (!oDados.oArquivo ||
            oDados.oArquivo.length < 1
        ) {
            return HttpResponse.badRequest(
                new CustomError('Arquivo é obrigatório', 4)
            )
        }

        return null
    }
    /*
     * @param  {object} oDados
     *
     * @return {object|null}  Retorna a resposta de erro ou null no caso de OK
     */
    async divisaoPersonalizada(oDados) {
        /**
         * Valida se existe o numero do destinatario
         */
        if (!oDados.originalname || !oDados.paginaInicial || !oDados.paginaFinal) 
        {
            return HttpResponse.badRequest(
                new CustomError('originalname, paginaInicial e paginaFinal são obrigatórios', 4)
            )
        }

        return null
    }
    /*
     * @param  {object} oDados
     *
     * @return {object|null}  Retorna a resposta de erro ou null no caso de OK
     */
    async divisaoFixa(oDados) {
        /**
         * Valida se existe o numero do destinatario
         */
        if (!oDados.originalname || !oDados.intervalo ) 
        {
            return HttpResponse.badRequest(
                new CustomError('originalname e intervalo são obrigatórios', 4)
            )
        }

        return null
    }
    /*
     * @param  {object} oDados
     *
     * @return {object|null}  Retorna a resposta de erro ou null no caso de OK
     */
    async baixarArquivo(oDados) {
        /**
         * Valida se existe o numero do destinatario
         */
        if (!oDados.originalname ) 
        {
            return HttpResponse.badRequest(
                new CustomError('originalname é obrigatórios', 4)
            )
        }

        return null
    }

    
}