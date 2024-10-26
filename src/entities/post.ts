import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user';
import { Comment } from './comment';

@Entity({ name: 'post' })
export class Post {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { nullable: true })
  caption?: string;

  @Column('varchar', { nullable: true })
  rawImgFilePath?: string;

  @Column('varchar', { nullable: true })
  processedImgFilePath?: string;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  createdBy: User;

  @Column({ nullable: true })
  createdById: number;

  @OneToMany(() => Comment, (comment) => comment.post, {
    nullable: true,
    eager: true,
  })
  comments?: Comment[];

  @Column({ default: 0 })
  commentCount: number;

  @Index()
  @CreateDateColumn({
    type: 'timestamptz',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt: Date;
}
