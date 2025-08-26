'use client';

import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/constants/mock-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useUmami } from '@/hooks/use-umami';
import { useEffect } from 'react';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const formSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  category: z.string().min(1, {
    message: 'Please select a category.'
  }),
  price: z.coerce
    .number({
      required_error: 'Price is required.',
      invalid_type_error: 'Price must be a number.'
    })
    .min(0, { message: 'Price must be a positive number.' }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.'
  })
});

export default function ProductFormWithTracking({
  initialData
}: {
  initialData: Product | null;
}) {
  const { track, trackFormSubmit, trackUserAction } = useUmami();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      category: '',
      price: 0,
      description: ''
    }
  });

  // 追踪表单字段变化
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        trackUserAction('form_field_change', {
          formName: 'product_form',
          fieldName: name,
          isEdit: !!initialData
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, trackUserAction, initialData]);

  // 追踪表单加载
  useEffect(() => {
    track('form_load', {
      formName: 'product_form',
      mode: initialData ? 'edit' : 'create',
      productId: initialData?.id
    });
  }, [track, initialData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 追踪表单提交开始
      track('form_submit_start', {
        formName: 'product_form',
        mode: initialData ? 'edit' : 'create'
      });

      // 这里添加实际的提交逻辑
      console.log('Form values:', values);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 追踪成功提交
      trackFormSubmit('product_form', true, {
        mode: initialData ? 'edit' : 'create',
        productName: values.name,
        category: values.category,
        price: values.price
      });

      // 重置表单
      if (!initialData) {
        form.reset();
      }
    } catch (error) {
      // 追踪失败提交
      trackFormSubmit('product_form', false, {
        mode: initialData ? 'edit' : 'create',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const handleCancel = () => {
    trackUserAction('form_cancel', {
      formName: 'product_form',
      mode: initialData ? 'edit' : 'create'
    });
    form.reset();
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {initialData ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <div className='space-y-6'>
                  <FormItem className='w-full'>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <FileUploader
                        value={field.value}
                        onValueChange={(files) => {
                          field.onChange(files);
                          trackUserAction('file_upload', {
                            formName: 'product_form',
                            fileCount: files?.length || 0
                          });
                        }}
                        maxFiles={1}
                        maxSize={5 * 1024 * 1024}
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter product name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        trackUserAction('category_select', {
                          formName: 'product_form',
                          category: value
                        });
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='electronics'>Electronics</SelectItem>
                        <SelectItem value='clothing'>Clothing</SelectItem>
                        <SelectItem value='food'>Food & Beverages</SelectItem>
                        <SelectItem value='books'>Books</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='Enter price'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter product description'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex gap-4'>
              <Button type='submit'>
                {initialData ? 'Update Product' : 'Add Product'}
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
