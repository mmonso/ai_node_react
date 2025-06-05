import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    
    // Para erros de class-validator, a mensagem pode estar aninhada
    let detailedMessage = message;
    if (exception instanceof HttpException && typeof exception.getResponse() === 'object') {
        const responseBody = exception.getResponse() as any;
        if (responseBody.message && Array.isArray(responseBody.message) && responseBody.message.length > 0) {
            detailedMessage = responseBody.message.join(', ');
        } else if (responseBody.message && typeof responseBody.message === 'string') {
            detailedMessage = responseBody.message;
        }
    }


    console.error(
        `HTTP Status: ${status} Error Message: ${JSON.stringify(detailedMessage)} Path: ${request.url}`,
        exception instanceof Error ? exception.stack : '',
      );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: detailedMessage,
    });
  }
}