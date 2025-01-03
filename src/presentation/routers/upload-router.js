/**
 * Classe para criação da rota de retorno para o usuário
 * 
 * Esse arquivo é responsável pelas validações básicas dos dados recebidos
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Genérica
 * @author    Equipe Webcartórios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-generica/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-generica
 * @CriadoEm  12/11/2024
 */

/**
 * Configurações globais
 */
const { CustomError } = require('../../utils/errors')
const HttpResponse = require('../helpers/http-response')

/**
 * Classe UploadRouter
 * @package  src\presentation\routers
 */
module.exports = class UploadRouter {
    /**
     * Construtor
     * @param {apiUseCase}
     * @param {apiValidator}
     */
    constructor({ apiUseCase, apiValidator } = {}) {
        this.apiUseCase = apiUseCase
        this.apiValidator = apiValidator
       
    }
     /**
     * Função para criação da rota
     *
     * @param {object} oHttp
     * @returns {HttpResponse}
     */
   async route(oHttp) {
        try {

            /**
             * Valida os dados da reuqisi��o
             *
             * @var {mixed} mValida
             */
            const mValida = await this.apiValidator.upload(oHttp.body)

            if(mValida != null){
                return mValida
            }

            /**
             * Faz upload do pdf
             * @var {object} Resultado
             * @UsaFuncao upload
             */
            const Resultado = await this.apiUseCase.upload(oHttp.body);

            if (Resultado.statusCode === 400) {
                return Resultado;
            }

            /**
             * Retorna dados
             */
            return HttpResponse.ok(Resultado);
        } catch (error) {
            console.log(error);
            /**
             * Caso gere algum erro
             * Retorna o erro
             */
            return HttpResponse.serverError();
        }
    }
}