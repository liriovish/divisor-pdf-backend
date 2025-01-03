/**
 * Esse arquivo � respons�vel pelas valida��es e tratamentos antes de enviar
 * a consulta ou cadastro ao banco de dados
 *
 * NodeJS version 16.x
 *
 * @category  JavaScript
 * @package   Api Gen�rica
 * @author    Equipe Webcart�rios <contato@webcartorios.com.br>
 * @copyright 2022 (c) DYNAMIC SYSTEM e Vish! Internet e Sistemas Ltda. - ME
 * @license   https://github.com/dynamic-system-vish/api-whatsapp/licence.txt BSD Licence
 * @link      https://github.com/dynamic-system-vish/api-whatsapp
 * @CriadoEm  14/11/2024
 */

/**
 * Configura��es globais
 */
const HttpResponse = require('../../presentation/helpers/http-response')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');

/**
 * Classe ApiUseCase
 * @package  src\domain\usecases
 */
module.exports = class ApiUseCase {
    /**
    * Função responsável por fazer upload de pdf      
    */
    async upload(oDados) {
        try {
            /**
             * Verifica e acessa o arquivo do objeto recebido
             * @var {object} oArquivo
             */
            const { oArquivo } = oDados;
    
            console.log('Arquivo recebido usecase:', oArquivo);
    
            /**
             * Obtém o buffer e o nome original do arquivo
             * @var {Buffer} buffer 
             * @var {string} originalname
             */
            const { buffer, originalname } = oArquivo;
    
            /**
             * Define o caminho de upload
             * @var {string} uploadPath 
             */
            const uploadPath = path.join(__dirname, '../../../uploads', `${originalname}`);
    
            /**
             * Salva o arquivo no sistema de arquivos
             */
            fs.writeFileSync(uploadPath, buffer);
    
            /**
             * Carrega o PDF e obtém o número total de páginas
             * @var {PDFDocument} pdfDoc 
             * @var {number} iTotalPages 
             */
            const pdfDoc = await PDFDocument.load(buffer);
            const iTotalPages = pdfDoc.getPageCount();
    
            /**
             * Retorna a resposta de sucesso com os detalhes do PDF
             */
            return HttpResponse.ok({
                message: 'PDF carregado com sucesso.',
                originalname,
                iTotalPages
            });
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
    
            /**
             * Retorna uma resposta de erro caso ocorra uma exceção
             * @var {object} error - Objeto do erro capturado
             */
            return HttpResponse.badRequest({
                message: 'Não foi possível fazer upload.',
                error: error.message
            });
        }
    }
    
    /**
     * Função responsável por fazer divisão personalizada do PDF
     */
    async divisaoPersonalizada(oDados) {
        try {
            /**
             * Desestrutura os dados recebidos e obtém o nome original do arquivo e os parâmetros de página
             * @var {string} originalname 
             * @var {number} paginaInicial 
             * @var {number} paginaFinal 
             */
            const { originalname, paginaInicial, paginaFinal } = oDados;

            /**
             * Define o caminho do arquivo original a ser processado
             * @var {string} uploadPath 
             */
            const uploadPath = path.join(__dirname, '../../../uploads', `${originalname}.pdf`);

            /**
             * Verifica se o arquivo existe no sistema de arquivos
             */
            if (!fs.existsSync(uploadPath)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }

            /**
             * Lê o arquivo PDF a partir do sistema de arquivos
             * @var {Buffer} pdfBytes - Conteúdo binário do arquivo PDF
             */
            const pdfBytes = fs.readFileSync(uploadPath);
            
            /**
             * Verifica se o conteúdo do arquivo é válido
             * Se o arquivo estiver vazio ou inválido, retorna erro 400
             */
            if (!pdfBytes || pdfBytes.length === 0) {
                return HttpResponse.badRequest({ message: 'Arquivo PDF inválido ou vazio.' });
            }

            /**
             * Carrega o documento PDF utilizando a biblioteca pdf-lib
             * @var {PDFDocument} pdfDoc
             */
            const pdfDoc = await PDFDocument.load(pdfBytes);
            
            /**
             * Obtém o total de páginas no arquivo PDF
             * @var {number} totalPages
             */
            const totalPages = pdfDoc.getPageCount();

            /**
             * Verifica se os parâmetros de página são válidos
             */
            if (isNaN(paginaInicial) || isNaN(paginaFinal)) {
                return HttpResponse.badRequest({ message: 'Os valores de página devem ser números válidos.' });
            }

            /**
             * Verifica se o intervalo de páginas está dentro dos limites do documento
             */
            if (paginaInicial < 1 || paginaFinal > totalPages || paginaInicial > paginaFinal) {
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }

            /**
             * Gera um array de índices representando as páginas a serem copiadas
             * @var {Array<number>} indices
             */
            const indices = Array.from(
                { length: paginaFinal - paginaInicial + 1 },
                (_, i) => (paginaInicial - 1) + i
            );

            /**
             * Verifica se algum índice está fora do intervalo válido de páginas
             */
            if (indices.some(index => index < 0 || index >= totalPages)) {
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }

            /**
             * Cria um novo documento PDF para armazenar as páginas copiadas
             * @var {PDFDocument} novoPdf 
             */
            const novoPdf = await PDFDocument.create();

            /**
             * Copia as páginas do documento original para o novo documento
             * @var {Array<PDFPage>} paginas
             */
            const paginas = await novoPdf.copyPages(pdfDoc, indices);

            /**
             * Adiciona as páginas copiadas no novo documento PDF
             */
            paginas.forEach((pagina) => novoPdf.addPage(pagina));

            /**
             * Salva o novo documento PDF em formato binário
             * @var {Buffer} novoPdfBytes
             */
            const novoPdfBytes = await novoPdf.save();

            /**
             * Define o caminho completo para salvar o novo arquivo PDF dividido
             * @var {string} novoPdfPath
             */
            const novoPdfPath = path.join(__dirname, '../../../downloads', `${originalname}-${paginaInicial}-${paginaFinal}.pdf`);

            /**
             * Salva o novo arquivo PDF no sistema de arquivos
             */
            fs.writeFileSync(novoPdfPath, novoPdfBytes);

            /**
             * Retorna uma resposta de sucesso com o caminho de download do novo arquivo PDF
             */
            return HttpResponse.ok({
                message: 'PDF dividido com sucesso.',
                downloadPath: novoPdfPath,
            });
        } catch (error) {
            console.error('Erro ao dividir PDF:', error);
            
            /**
             * Retorna uma resposta de erro caso ocorra uma exceção durante a divisão do PDF
             * @var {object} error 
             */
            return HttpResponse.badRequest({
                message: 'Erro ao dividir o PDF.',
                error: error.message,
            });
        }
    }

        
    /**
     * Função responsável por fazer divisão fixa do PDF em intervalos definidos
     */
    async divisaoFixa(oDados) {
        try {
            /**
             * Desestrutura os dados recebidos e obtém o nome original do arquivo e o intervalo
             * @var {string} originalname 
             * @var {number} intervalo 
             */
            const { originalname, intervalo } = oDados;

            /**
             * Define o caminho do arquivo original a ser processado
             * @var {string} uploadPath 
             */
            const uploadPath = path.join(__dirname, '../../../uploads', `${originalname}.pdf`);

            /**
             * Verifica se o arquivo existe no sistema de arquivos
             */
            if (!fs.existsSync(uploadPath)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }

            /**
             * Lê o arquivo PDF a partir do sistema de arquivos
             * @var {Buffer} pdfBytes 
             */
            const pdfBytes = fs.readFileSync(uploadPath);

            /**
             * Verifica se o conteúdo do arquivo é válido
             */
            if (!pdfBytes || pdfBytes.length === 0) {
                return HttpResponse.badRequest({ message: 'Arquivo PDF inválido ou vazio.' });
            }

            /**
             * Carrega o documento PDF utilizando a biblioteca pdf-lib
             * @var {PDFDocument} pdfDoc 
             */
            const pdfDoc = await PDFDocument.load(pdfBytes);
            
            /**
             * Obtém o total de páginas no arquivo PDF
             * @var {number} totalPages 
             */
            const totalPages = pdfDoc.getPageCount();

            /**
             * Verifica se o intervalo é válido
             * Se o intervalo não for válido, retorna erro 400
             */
            if (isNaN(intervalo) || intervalo < 1 || intervalo > totalPages) {
                return HttpResponse.badRequest({ message: 'Intervalo de páginas inválido.' });
            }

            /**
             * Calcula o número de partes que o PDF será dividido
             * @var {number} numDivisoes 
             */
            const numDivisoes = Math.ceil(totalPages / intervalo);
            
            /**
             * Cria uma lista de arquivos PDF gerados
             * @var {Array<Buffer>} arquivosPdf 
             */
            const arquivosPdf = [];

            /**
             * Divide o PDF em partes com o intervalo fixo e cria os arquivos PDF
             */
            for (let i = 0; i < numDivisoes; i++) {
                const novoPdf = await PDFDocument.create();
                const inicio = i * intervalo;
                const fim = Math.min((i + 1) * intervalo, totalPages);

                /**
                 * Cria os índices das páginas que serão copiadas para este novo arquivo
                 * @var {Array<number>} indices - Índices das páginas a serem copiadas
                 */
                const indices = Array.from({ length: fim - inicio }, (_, j) => inicio + j);

                /**
                 * Copia as páginas do documento original para o novo documento
                 */
                const paginas = await novoPdf.copyPages(pdfDoc, indices);
                paginas.forEach((pagina) => novoPdf.addPage(pagina));

                /**
                 * Salva o novo arquivo PDF
                 * @var {Buffer} novoPdfBytes - Conteúdo binário do novo PDF
                 */
                const novoPdfBytes = await novoPdf.save();
                arquivosPdf.push(novoPdfBytes);
            }

            /**
             * Caso o número de arquivos gerados seja maior que 2, cria um arquivo ZIP
             */
            let downloadPath;
            if (arquivosPdf.length > 2) {
                /**
                 * Cria um arquivo ZIP contendo todos os PDFs gerados
                 * @var {string} zipPath - Caminho do arquivo ZIP a ser gerado
                 */
                const zipPath = path.join(__dirname, '../../../downloads', `${originalname}-dividido.zip`);

                /**
                 * Cria um arquivo temporário para armazenar o ZIP
                 */
                const zip = new AdmZip();

                arquivosPdf.forEach((pdfBuffer, index) => {
                    const pdfName = `${originalname}-${index + 1}.pdf`;
                    zip.addFile(pdfName, pdfBuffer);
                });

                /**
                 * Salva o arquivo ZIP no sistema de arquivos
                 */
                zip.writeZip(zipPath);
                downloadPath = zipPath;
            } else {
                /**
                 * Caso haja 2 ou menos arquivos, salva cada arquivo PDF individualmente
                 */
                downloadPath = arquivosPdf.map((pdfBuffer, index) => {
                    const pdfPath = path.join(__dirname, '../../../downloads', `${originalname}-${index + 1}.pdf`);
                    fs.writeFileSync(pdfPath, pdfBuffer);
                    return pdfPath;
                });
            }

            /**
             * Retorna a resposta de sucesso com o caminho de download do(s) arquivo(s) gerado(s)
             */
            return HttpResponse.ok({
                message: 'PDF dividido com sucesso.',
                downloadPath,
            });
        } catch (error) {
            console.error('Erro ao dividir PDF:', error);

            /**
             * Retorna uma resposta de erro caso ocorra uma exceção durante a divisão do PDF
             * @var {object} error - Objeto do erro capturado
             */
            return HttpResponse.badRequest({
                message: 'Erro ao dividir o PDF.',
                error: error.message,
            });
        }
    }


    async baixarArquivo(oDados) {
        try {
            const { originalname } = oDados;

            /**
             * Define o caminho completo do arquivo a ser baixado
             * @var {string} downloadPath
             */
            const downloadPath = path.join(__dirname, '../../../downloads', originalname);

            /**
             * Verifica se o arquivo existe no sistema de arquivos
             */
            if (!fs.existsSync(downloadPath)) {
                return HttpResponse.badRequest({ message: 'Arquivo não encontrado.' });
            }
    
            return {download: downloadPath}
           
        } catch (error) {
            console.error('Erro ao buscar arquivo para download:', error);

            /**
             * Retorna um erro genérico caso algum problema ocorra
             */
            return HttpResponse.badRequest({
                message: 'Erro ao buscar o arquivo.',
                error: error.message,
            });
        }
    }

}