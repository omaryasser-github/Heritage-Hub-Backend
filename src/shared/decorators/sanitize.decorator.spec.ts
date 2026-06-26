import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendMessageDto } from '../../modules/ai-chat/dto/send-message.dto';

describe('SanitizeText decorator', () => {
  it('strips HTML tags from chat messages', async () => {
    const dto = plainToInstance(SendMessageDto, {
      message: '<script>alert(1)</script>Hello Luxor',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.message).toBe('Hello Luxor');
  });
});
